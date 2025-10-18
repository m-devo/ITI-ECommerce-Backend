import { CartService } from '../../../services/cart.service.js';
import catchAsync from '../../../utils/catchAsync.js';
import ApiResponse from '../../../utils/ApiResponse.js';


export const CartController = {

    getUserCart: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const cart = await CartService.getUserCart(userId);
        res.status(200).json(new ApiResponse(200, cart, "Cart retrieved successfully"));
    }),
    
    updateBooksInCart: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const books = req.body;
        const cart = await CartService.updateBooksInCart(userId, books);
        res.status(200).json(new ApiResponse(200, cart, "Cart updated successfully"));
    }),

    incrementItemQuantity: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const { bookId } = req.params;
        const cart = await CartService.incrementItemQuantity(userId, bookId);
        res.status(200).json(new ApiResponse(200, cart, "Item quantity incremented successfully"));
    }),

    decrementItemQuantity: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const { bookId } = req.params;
        const cart = await CartService.decrementItemQuantity(userId, bookId);
        res.status(200).json(new ApiResponse(200, cart, "Item quantity decremented successfully"));
    }),

    removeItemFromCart: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const { bookId } = req.params;
        const cart = await CartService.removeItemFromCart(userId, bookId);
        res.status(200).json(new ApiResponse(200, cart, "Item removed from cart successfully"));
    }),

    clearCart: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        await CartService.clearCart(userId);
        res.status(200).json(new ApiResponse(200, null, "Cart cleared successfully"));
    }),

    AbandonedCartReminder: catchAsync(async (req, res, next) => {
        await CartService.AbandonedCartReminder();

        res.status(200).json(
            new ApiResponse(200, null, "Abandoned cart reminder process was triggered successfully.")
        );
    })
};
