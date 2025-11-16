import { Cart } from '../models/cart.model.js';
import ApiError from '../utils/ApiError.js';
import emailService from './email.service.js';
import { getIdString } from '../utils/id.util.js';
import Book from '../models/bookSchema.js';
import redisClient from '../../config/redis.js';
import { deleteRedisCache } from '../utils/redis.utils.js';

const getCartKey = (userId) => `cart:${getIdString(userId)}`;

const CART_CACHE_DURATION = 60 * 60 * 24; // 1 day

export const CartService = {

    async getUserCart(userId) {
        if (!userId) {
            throw new ApiError(400, 'User ID is required');
        }

        const cartKey = getCartKey(userId);

        try {
            const cachedCart = await redisClient.get(cartKey);
            if (cachedCart) {
                try {
                    return JSON.parse(cachedCart);
                } catch (parseErr) {
                    console.error('Error parsing cached cart:', parseErr);
                    // Invalidate corrupted cache
                    await redisClient.del(cartKey);
                }
            }
        } catch (err) {
            console.error('Redis GET error:', err);
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await this.createCartForUser(userId);
        }

        // Synchronize cart stock like update methods
        const synchronizedCart = await this.synchronizeCartStock(cart, userId);

        try {
            await redisClient.set(cartKey, JSON.stringify(synchronizedCart), {
                EX: CART_CACHE_DURATION,
            });
        } catch (err) {
            console.error('Redis SET error:', err);
        }

        return synchronizedCart;
    },

    /**
     * Creates a new cart for the user if one doesn't exist.
     * @param {string} userId - The user's ID.
     * @returns {Promise<Object>} The cart document.
     */
    async createCartForUser(userId) {
        if (!userId) {
            throw new ApiError(400, 'User ID is required');
        }

        let cart = await Cart.findOne({ userId });
        if (cart) {
            return cart;
        }

        cart = new Cart({ userId, items: [] });
        await cart.save();
        return cart;
    },

    /**
     * Synchronizes the cart by validating stock and removing unavailable items.
     * Updates the cart in DB and cache if changes are made.
     * @param {Object} cart - The cart document.
     * @param {string} userId - The user's ID.
     * @returns {Promise<Object>} The populated cart object.
     */
    async synchronizeCartStock(cart, userId) {
        if (!cart || !cart.items || cart.items.length === 0) {
            return await this.populateCart(cart);
        }

        const bookIds = cart.items.map(item => item.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });
        const booksMap = new Map(books.map(book => [book._id.toString(), book]));

        let needsSave = false;
        const updatedItems = [];

        for (const item of cart.items) {
            const book = booksMap.get(getIdString(item.bookId));

            if (!book || book.stock === 0) {
                needsSave = true;
                continue; // Remove item
            }

            if (item.quantity > book.stock) {
                item.quantity = book.stock;
                needsSave = true;
            }

            updatedItems.push(item);
        }

        cart.items = updatedItems;

        const populatedCart = await this.populateCart(cart);

        if (needsSave) {
            await cart.save();
            // Update cache instead of deleting
            const cartKey = getCartKey(userId);
            try {
                await redisClient.set(cartKey, JSON.stringify(populatedCart), {
                    EX: CART_CACHE_DURATION,
                });
            } catch (err) {
                console.error('Redis SET error:', err);
            }
        }

        return populatedCart;
    },

    /**
     * Updates multiple books in the user's cart.
     * @param {string} userId - The user's ID.
     * @param {Array} bookUpdates - Array of { bookId, quantity } objects.
     * @returns {Promise<Object>} The updated populated cart.
     */
    async updateBooksInCart(userId, bookUpdates) {
        // Input validation
        this.validateUpdateBooksInput(userId, bookUpdates);

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await this.createCartForUser(userId);
        }

        // Bulk fetch books for validation
        const bookIds = bookUpdates.map(update => update.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });
        const booksMap = new Map(books.map(book => [book._id.toString(), book]));

        // Create a map for fast cart item lookup
        const cartItemsMap = new Map(
            cart.items.map(item => [getIdString(item.bookId), item])
        );

        // Process each update
        const processedUpdates = this.processBookUpdates(bookUpdates, booksMap);

        // Apply updates to cart items
        for (const { bookId, quantity } of processedUpdates) {
            const bookIdStr = getIdString(bookId);
            const existingItem = cartItemsMap.get(bookIdStr);

            if (quantity === 0) {
                if (existingItem) {
                    cart.items.splice(cart.items.indexOf(existingItem), 1);
                }
            } else {
                if (existingItem) {
                    existingItem.quantity = quantity;
                } else {
                    cart.items.push({ bookId, quantity });
                }
            }
        }

        // Save the cart and update cache
        await cart.save();
        const populatedCart = await this.populateCart(cart);
        try {
            await redisClient.set(getCartKey(userId), JSON.stringify(populatedCart), {
                EX: CART_CACHE_DURATION,
            });
        } catch (err) {
            console.error('Redis SET error:', err);
        }

        // Synchronize stock and get populated cart
        const synchronizedCart = await this.synchronizeCartStock(cart, userId);

        return synchronizedCart;
    },

    /**
     * Validates input for updateBooksInCart.
     * @param {string} userId - The user's ID.
     * @param {Array} bookUpdates - Array of { bookId, quantity }.
     * @throws {ApiError} If validation fails.
     */
    validateUpdateBooksInput(userId, bookUpdates) {
        if (!userId) {
            throw new ApiError(400, 'User ID is required');
        }
        if (!Array.isArray(bookUpdates) || bookUpdates.length === 0) {
            throw new ApiError(400, 'Book updates array is required and cannot be empty');
        }

        const seenBookIds = new Set();
        for (const update of bookUpdates) {
            if (!update || typeof update !== 'object') {
                throw new ApiError(400, 'Each book update must be an object');
            }
            if (!update.bookId) {
                throw new ApiError(400, 'Book ID is required for each update');
            }
            if (!Number.isInteger(update.quantity) || update.quantity < 0) {
                throw new ApiError(400, 'Quantity must be a non-negative integer');
            }

            const bookIdStr = getIdString(update.bookId);
            if (seenBookIds.has(bookIdStr)) {
                throw new ApiError(400, 'Duplicate book IDs are not allowed');
            }
            seenBookIds.add(bookIdStr);
        }
    },

    /**
     * Processes book updates, validating each against available books.
     * @param {Array} bookUpdates - Array of { bookId, quantity }.
     * @param {Map} booksMap - Map of book ID strings to book documents.
     * @returns {Array} Array of validated { bookId, quantity }.
     * @throws {ApiError} If any book is invalid.
     */
    processBookUpdates(bookUpdates, booksMap) {
        const processed = [];

        for (const { bookId, quantity } of bookUpdates) {
            const book = booksMap.get(getIdString(bookId));

            if (!book) {
                throw new ApiError(404, `Book with ID ${bookId} not found`);
            }

            if (quantity > 0 && book.stock < quantity) {
                throw new ApiError(400, `Only ${book.stock} units of "${book.title}" are available`);
            }

            processed.push({ bookId, quantity });
        }

        return processed;
    },

    /**
     * Increments the quantity of a book in the cart.
     * @param {string} userId - The user's ID.
     * @param {string} bookId - The book's ID.
     * @returns {Promise<Object>} The updated populated cart.
     */
    async incrementItemQuantity(userId, bookId) {
        if (!userId || !bookId) {
            throw new ApiError(400, 'User ID and Book ID are required');
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await this.createCartForUser(userId);
        }

        const bookIdStr = getIdString(bookId);
        const item = cart.items.find(item => getIdString(item.bookId) === bookIdStr);

        // Fetch book once and validate
        const book = await Book.findById(bookId);
        if (!book) {
            throw new ApiError(404, 'Book not found');
        }

        if (!item) {
            if (book.stock < 1) {
                throw new ApiError(400, `Book is out of stock`);
            }
            cart.items.push({ bookId, quantity: 1 });
        } else {
            if (item.quantity + 1 > book.stock) {
                throw new ApiError(400, `Only ${book.stock} units of ${book.title} are available`);
            }
            item.quantity += 1;
        }

        await cart.save();
        const populatedCart = await this.populateCart(cart);
        // Update cache with new data
        try {
            await redisClient.set(getCartKey(userId), JSON.stringify(populatedCart), {
                EX: CART_CACHE_DURATION,
            });
        } catch (err) {
            console.error('Redis SET error:', err);
        }
        return populatedCart;
    },

    /**
     * Decrements the quantity of a book in the cart.
     * @param {string} userId - The user's ID.
     * @param {string} bookId - The book's ID.
     * @returns {Promise<Object>} The updated populated cart.
     */
    async decrementItemQuantity(userId, bookId) {
        if (!userId || !bookId) {
            throw new ApiError(400, 'User ID and Book ID are required');
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new ApiError(404, 'Cart not found');
        }

        const bookIdStr = getIdString(bookId);
        const item = cart.items.find(item => getIdString(item.bookId) === bookIdStr);

        if (!item) {
            throw new ApiError(404, 'Item not found in cart');
        }

        item.quantity -= 1;

        if (item.quantity < 1) {
            cart.items = cart.items.filter(i => getIdString(i.bookId) !== bookIdStr);
        }

        await cart.save();
        const populatedCart = await this.populateCart(cart);
        // Update cache with new data
        try {
            await redisClient.set(getCartKey(userId), JSON.stringify(populatedCart), {
                EX: CART_CACHE_DURATION,
            });
        } catch (err) {
            console.error('Redis SET error:', err);
        }
        return populatedCart;
    },

    /**
     * Removes a specific item from the cart.
     * @param {string} userId - The user's ID.
     * @param {string} bookId - The book's ID.
     * @returns {Promise<Object>} The updated populated cart.
     */
    async removeItemFromCart(userId, bookId) {
        if (!userId || !bookId) {
            throw new ApiError(400, 'User ID and Book ID are required');
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new ApiError(404, 'Cart not found');
        }

        const bookIdStr = getIdString(bookId);
        cart.items = cart.items.filter(item => getIdString(item.bookId) !== bookIdStr);

        await cart.save();
        const populatedCart = await this.populateCart(cart);
        // Update cache with new data
        try {
            await redisClient.set(getCartKey(userId), JSON.stringify(populatedCart), {
                EX: CART_CACHE_DURATION,
            });
        } catch (err) {
            console.error('Redis SET error:', err);
        }
        return populatedCart;
    },

    /**
     * Clears all items from the cart.
     * @param {string} userId - The user's ID.
     * @returns {Promise<Object>} The cleared cart.
     */
    async clearCart(userId) {
        if (!userId) {
            throw new ApiError(400, 'User ID is required');
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            throw new ApiError(404, 'Cart not found');
        }

        cart.items = [];
        await cart.save();
        // Update cache with cleared cart
        try {
            await redisClient.set(getCartKey(userId), JSON.stringify(cart), {
                EX: CART_CACHE_DURATION,
            });
        } catch (err) {
            console.error('Redis SET error:', err);
        }
        return cart;
    },

    /**
     * Validates if a book exists and has sufficient stock.
     * @param {string} bookId - The book's ID.
     * @param {number} quantity - The required quantity.
     * @returns {Promise<Object>} The book document.
     */
    async validateBook(bookId, quantity) {
        if (!bookId || quantity < 1) {
            throw new ApiError(400, 'Invalid book ID or quantity');
        }

        const book = await Book.findById(bookId);
        if (!book) {
            throw new ApiError(404, 'Book not found');
        }
        if (book.stock < quantity) {
            throw new ApiError(400, `Only ${book.stock} units of ${book.title} are available`);
        }
        return book;
    },

    /**
     * Populates the cart with book details.
     * @param {Object} cart - The cart document.
     * @returns {Promise<Object>} The populated cart object.
     */
    async populateCart(cart) {
        if (!cart) return null;

        if (cart.populate) {
            await cart.populate('items.bookId');
        }

        let populatedCart;
        if (cart.toObject) {
            populatedCart = cart.toObject();
        } else if (typeof cart === 'object') {
            populatedCart = { ...cart };
        } else {
            // Handle case where cart is not an object (e.g., just an ID string)
            populatedCart = { _id: cart, items: [] };
        }

        if (!populatedCart.items || !Array.isArray(populatedCart.items)) {
            populatedCart.items = [];
        }

        populatedCart.items = populatedCart.items
            .filter(item => item && item.bookId !== null) // Filter out items where book no longer exists
            .map(item => ({
                quantity: item.quantity || 0,
                book: item.bookId,
            }));
        return populatedCart;
    },

    /**
     * Sends reminders for abandoned carts.
     * @returns {Promise<Object>} Status message.
     */
    async AbandonedCartReminder() {
        console.log('Starting Cron Job 4 - cart reminder loading...');

        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

            const abandonedCarts = await Cart.find({
                items: { $exists: true, $ne: [] },
                reminderSent: false,
                updatedAt: { $gte: fourDaysAgo, $lt: oneDayAgo },
            }).populate('userId', 'firstName email').populate('items.bookId');

            if (abandonedCarts.length === 0) {
                console.log('No abandoned carts to remind.');
                return { message: 'No abandoned carts to remind.', count: 0 };
            }

            console.log(`Found ${abandonedCarts.length} abandoned carts. Sending reminders...`);

            for (const abandonedCart of abandonedCarts) {
                if (!abandonedCart.userId) {
                    console.log(`Skipping cart ${abandonedCart._id} because its user no longer exists or is not populated.`);
                    continue;
                }

                const validCartItems = abandonedCart.items.filter(item => item.bookId !== null);

                if (validCartItems.length === 0) {
                    console.log(`Skipping cart ${abandonedCart._id} for user ${abandonedCart.userId.email} because its books no longer exist.`);
                    continue;
                }

                const header = 'You left something in your cart! 🛒';
                const cartItemsHtml = validCartItems.map(item =>
                    `<li><b>${item.bookId.title}</b> - Price: ${item.bookId.price} EGP</li>`
                ).join('');

                const emailBody = `
                    <h1>Hello friend ${abandonedCart.userId.firstName},</h1>
                    <p>We noticed you left some items in your shopping cart. Don't miss out!</p>
                    <ul>
                        ${cartItemsHtml}
                    </ul>
                    <p>Complete your purchase now!</p>
                    <a href="${process.env.FRONTEND_URL}/cart" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                        Proceed to Cart
                    </a>
                    <br><br>
                    <p>Book Store Team</p>
                `;

                await emailService.sendEmail({
                    to: abandonedCart.userId.email,
                    subject: header,
                    html: emailBody,
                });

                abandonedCart.reminderSent = true;
                await abandonedCart.save();
            }

            console.log('Abandoned cart reminders sent successfully.');
            return { message: 'Abandoned cart reminders sent successfully.', count: abandonedCarts.length };
        } catch (error) {
            console.error('Error in AbandonedCartReminder job:', error);
            throw new ApiError(500, 'Failed to send abandoned cart reminders');
        }
    },
};

