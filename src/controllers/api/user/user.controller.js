import { UserService } from '../../../services/user.service.js';
import catchAsync from '../../../utils/catchAsync.js';
import ApiResponse from '../../../utils/ApiResponse.js';


export const UserController = {

    getUserProfile: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const user = await UserService.getUserProfile(userId);
        res.status(200).json(new ApiResponse(200, user, "User Profile retrieved successfully"));
    }),

    getUserOrders: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const orders = await UserService.getUserOrders(userId);
        res.status(200).json(new ApiResponse(200, orders, "User Orders retrieved successfully"));
    }),
    
    getUserBooks: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const books = await UserService.getUserBooks(userId);
        res.status(200).json(new ApiResponse(200, books, "User Books successfully"));
    }),
};
