import { Cart } from '../models/cart.model.js';
import ApiError from '../utils/ApiError.js';

export const CartService = {

    // get user cart by userId from cart collection
    async getUserCart(userId) {
        let cart = await Cart.findOne({ _id: userId });

        if (!cart) {
            return this.createCartForUser(userId);
        }
        
        return cart;
    },

    // create user cart if not exists
    async createCartForUser(userId) {
        const newCart = new Cart({ _id: userId, items: [] });
        await newCart.save();
        return newCart;
    },


    // update book in user cart
    async updateBookInCart(userId, bookId, quantity) {
        if (quantity < 1) {
            return this.removeBookFromCart(userId, bookId);
        }

        const cart = await this.getUserCart(userId);
        const item = cart.items.find(item => item.bookId.equals(bookId));

        if (item) {
            item.quantity = quantity;
        } else {
            cart.items.push({ bookId, quantity });
        }

        await cart.save();
        return cart.populate('items.bookId');
    },

    async incrementItemQuantity(userId, bookId) {
        const cart = await this.getUserCart(userId);
        const item = cart.items.find(item => item.bookId.equals(bookId));

        if (item) {
            item.quantity += 1;
        } else {
            cart.items.push({ bookId: bookId, quantity: 1 });
        }
        
        await cart.save();
        return cart.populate('items.bookId');
    },

    async decrementItemQuantity(userId, bookId) {
        const cart = await this.getUserCart(userId);
        const item = cart.items.find(item => item.bookId.equals(bookId));

        if (!item) {
            return cart;
        }

        item.quantity -= 1;

        if (item.quantity < 1) {
            cart.items = cart.items.filter(i => !i.bookId.equals(bookId));
        }
        
        await cart.save();
        return cart.populate('items.bookId');
    },

    // validate cart stock and availability
    async validateCartStock(cart) {
        if (!cart.items.length) {
            return true; // Cart is empty, nothing to validate
        }

        // Step 1: Get all book IDs from the cart
        const bookIds = cart.items.map(item => item.bookId._id);

        // Step 2: Fetch all books in a single query
        const books = await Book.find({ '_id': { $in: bookIds } });

        // Create a Map for quick lookups (O(1) complexity) instead of searching array every time
        const booksMap = new Map(books.map(book => [book._id.toString(), book]));
        
        let needsSave = false;
        
        // Use a filter to create the new items array
        const updatedItems = cart.items.filter(item => {
            const book = booksMap.get(item.bookId._id.toString());

            // Condition 1: If book doesn't exist anymore, remove it from cart
            if (!book) {
                needsSave = true;
                return false; // 'false' in filter removes the item
            }

            // Condition 2: If book is out of stock, remove it
            if (book.stock === 0) {
                needsSave = true;
                return false;
            }

            // Condition 3: If cart quantity is more than available stock, adjust it
            if (item.quantity > book.stock) {
                item.quantity = book.stock;
                needsSave = true;
            }

            return true; // Keep the item
        });

        // Step 3 & 4: Update cart items and save only if changes were made
        if (needsSave) {
            cart.items = updatedItems;
            await cart.save();
        }

        return true;
    },


    // remove book from user cart
    async removeBookFromCart(userId, bookId) {
        const cart = await this.getUserCart(userId);
        cart.items = cart.items.filter(item => !item.bookId.equals(bookId));
        await cart.save();
        return cart;
    }
};