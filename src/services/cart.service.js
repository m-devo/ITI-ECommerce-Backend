import { Cart } from '../models/cart.model.js';
import ApiError from '../utils/ApiError.js';
import emailService from "./email.service.js";
import { getIdString } from '../utils/id.util.js';
import Book from '../models/bookSchema.js';


export const CartService = {

    // get user cart by userId from cart collection
    async getUserCart(userId) {
        let cart = await Cart.findOne({ userId: userId }).populate('items.bookId').lean();

        if (!cart) {
            return this.createCartForUser(userId);
        }


        cart.items = cart.items.map(item => ({
            quantity: item.quantity,
            book: item.bookId 
        }));
    
        return cart;
    },

    // create user cart if not exists
    async createCartForUser(userId) {
        const existingCart = await Cart.findOne({ userId: userId });
        if (existingCart) {
            return existingCart;
        }
        const newCart = new Cart({ userId: userId, items: [] });
        await newCart.save();
        return newCart;
    },

    // synchronize cart validate stock and availability
    async synchronizeCartStock(userId) {
        let cart = await Cart.findOne({ userId });
        
        if (!cart || !cart.items || cart.items.length === 0) {
            return cart; 
        }

        const bookIds = cart.items.map(item => item.bookId);
        const books = await Book.find({ '_id': { $in: bookIds } });
        const booksMap = new Map(books.map(book => [book._id.toString(), book]));
        
        let needsSave = false;

        const originalItemsCount = cart.items.length;
        cart.items = cart.items.reduce((acc, currentItem) => {
            const book = booksMap.get(getIdString(currentItem.bookId));

            if (!book || book.stock === 0) {
                needsSave = true; 
                return acc; 
            }

            if (currentItem.quantity > book.stock) {
                currentItem.quantity = book.stock;
                needsSave = true;
            }
            
            acc.push(currentItem);
            return acc;
        }, []); 
        if (needsSave) {
            await cart.save();
        }

        const populatedCart = cart.toObject(); 
        populatedCart.items = populatedCart.items.map(item => ({
            ...item,
            book: booksMap.get(getIdString(item.bookId)) 
        }));

        return populatedCart;
    },


    async updateBooksInCart(userId, bookUpdates) {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = await this.createCartForUser(userId);
        }

        for (const { bookId, quantity } of bookUpdates) {
            await this.validateBook(bookId, quantity);

            const bookIdStr = getIdString(bookId);
            const itemIndex = cart.items.findIndex(item => {
                const itemIdStr = getIdString(item.bookId);
                return itemIdStr === bookIdStr;
            });
            
            if (quantity < 1) {
                if (itemIndex > -1) {
                    cart.items.splice(itemIndex, 1); 
                }
                continue; 
            }

            if (itemIndex > -1) {
                cart.items[itemIndex].quantity = quantity;
            } 
            
            else {

                const bookIdToStore = bookId && bookId._id ? bookId._id : bookId;
                cart.items.push({ bookId: bookIdToStore, quantity });
            }
        }


        await this.synchronizeCartStock(userId); 

        await cart.save();

        await cart.populate('items.bookId');

        return cart;
    },


    async incrementItemQuantity(userId, bookId) {
        let book = await this.validateBook(bookId, 1);

        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            cart = await this.createCartForUser(userId);
        }

        const bookIdStr = getIdString(bookId);
        let item = cart.items.find(item => {
            const itemIdStr = getIdString(item.bookId);
            return itemIdStr === bookIdStr;
        });

        if (!item) {
            cart.items.push({ bookId: bookId, quantity: 1 });
        } else {
            item.quantity += 1;
            if (item.quantity > book.stock) {
                throw new ApiError(400, `Only ${book.stock} units of ${book.title} are available`);
            }
        }

        await cart.save();

        await cart.populate('items.bookId');

        return cart;
    },

    async decrementItemQuantity(userId, bookId) {

        await this.validateBook(bookId, 1);

        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            throw new ApiError(404, 'Cart not found');
        }

        const bookIdStr = getIdString(bookId);
        const item = cart.items.find(item => {
            const itemIdStr = getIdString(item.bookId);
            return itemIdStr === bookIdStr;
        });

        if (!item) {
            throw new ApiError(404, 'Item not found in cart');
        }

        item.quantity -= 1;

        if (item.quantity < 1) {
            cart.items = cart.items.filter(i => getIdString(i.bookId) !== bookIdStr);
        }
        
        await cart.save();

        await cart.populate('items.bookId');

        return cart;
    },


    // remove item from user cart
    async removeItemFromCart(userId, bookId) {

        await this.validateBook(bookId, 1);

        const cart = await Cart.findOne({ userId: userId });


        if (!cart) {
            throw new ApiError(404, 'Cart not found');
        }

        const bookIdStr = getIdString(bookId);
        cart.items = cart.items.filter(item => {
            const itemIdStr = getIdString(item.bookId);
            return itemIdStr !== bookIdStr;
        });

        await cart.save();

        await cart.populate('items.bookId');

        return cart;
    },

    // remove all items from user cart
    async clearCart(userId) {
        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            throw new ApiError(404, 'Cart not found');
        }

        cart.items = [];
        await cart.save();

        return cart;
    },

    async validateBook(bookId, quantity) {
        const book = await Book.findById(bookId);
        if (!book) {
            throw new ApiError(404, 'Book not found');
        }
        if (book.stock < quantity) {
            throw new ApiError(400, `Only ${book.stock} units of ${book.title} are available`);
        }
        return book;
    },



    async AbandonedCartReminder() {
        console.log("Starting Cron Job 4 - cart reminder loading...");

        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

            const abandonedCarts = await Cart.find({
                cartItems: { $exists: true, $ne: [] },
                reminderSent: false,
                lastUpdateAt: { $gte: fourDaysAgo, $lt: oneDayAgo }
            }).populate("user", "firstName email").populate("cartItems.book");

            if (abandonedCarts.length === 0) {
                console.log("No abandoned carts to remind.");
                return;
            }

            console.log(`Found ${abandonedCarts.length} abandoned carts. Sending reminders...`);

            for (const abandonedCart of abandonedCarts) {
                if (!abandonedCart.user) {
                    console.log(`Skipping cart ${abandonedCart._id} because its user no longer exists.`);
                    continue; 
                }
                const validCartItems = abandonedCart.cartItems.filter(item => item.book !== null);

                if (validCartItems.length === 0) {
                    console.log(`Skipping cart ${abandonedCart._id} for user ${abandonedCart.user.email} because its books no longer exist.`);
                    continue;
                }
        
                const header = "You left something in your cart! 🛒";
                const cartItemsHtml = abandonedCart.cartItems.map(item =>
                    `<li><b>${item.book.title}</b> - Price: ${item.book.price} EGP</li>`
                ).join("");

                const emailBody = `
                    <h1>Hello frined ${abandonedCart.user.firstName},</h1>
                    <p>We noticed you left some items in your shopping cart. Don't miss out!</p>
                    <ul>
                        ${cartItemsHtml}
                    </ul>
                    <p>Complete your purchase now!</p>
                    <a href="${process.env.FRONTEND_URL}/cart" style="padding: 10px 15px; background-color: #007bff; 
                    color: white; text-decoration: none; border-radius: 5px;">
                    Proceed to Cart
                    </a>
                    <br><br>
                    <p>Book Store Team</p>
                `;

                await emailService.sendEmail({
                    to: abandonedCart.user.email,
                    subject: header,
                    html: emailBody
                });

                abandonedCart.reminderSent = true;
                await abandonedCart.save();
            }
            console.log("Abandoned cart reminders sent successfully.");
        } catch (error) {
            console.error("Error in AbandonedCartReminder job:", error);
        }
    }

};    

