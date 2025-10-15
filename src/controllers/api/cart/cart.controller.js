import { CartService } from '../../../services/cart.service.js';
import catchAsync from '../../../utils/catchAsync.js';
import ApiResponse from '../../../utils/ApiResponse.js';


export const CartController = {
    getUserCart: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const cart = await CartService.getUserCart(userId);
        res.status(200).json(new ApiResponse(200, cart, "Cart retrieved successfully"));
    }),
    
    updateBookInCart: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const { bookId, quantity } = req.body;
        const cart = await CartService.updateBookInCart(userId, bookId, quantity);
        res.status(200).json(new ApiResponse(200, cart, "Cart updated successfully"));
    }),

    incrementItemQuantity: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const { bookId } = req.body;
        const cart = await CartService.incrementItemQuantity(userId, bookId);
        res.status(200).json(new ApiResponse(200, cart, "Item quantity incremented successfully"));
    }),

    decrementItemQuantity: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const { bookId } = req.body;
        const cart = await CartService.decrementItemQuantity(userId, bookId);
        res.status(200).json(new ApiResponse(200, cart, "Item quantity decremented successfully"));
    }),

    removeBookFromCart: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const { bookId } = req.body;
        const cart = await CartService.removeBookFromCart(userId, bookId);
        res.status(200).json(new ApiResponse(200, cart, "Item removed from cart successfully"));
    }),

    clearCart: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        await CartService.clearCart(userId);
        res.status(200).json(new ApiResponse(200, null, "Cart cleared successfully"));
    }),
};

// import cartService from "../../../services/cart.service.js";
// import ApiResponse from "../../../utils/ApiResponse.js";
// import catchAsync from "../../../utils/catchAsync.js";

// const cartController = catchAsync(async (req, res, next) => {
//     await cartService.AbandonedCartReminder();

//     res.status(200).json(
//         new ApiResponse(200, null, "Abandoned cart reminder process was triggered successfully.")
//     );
// });

// export default cartController;
