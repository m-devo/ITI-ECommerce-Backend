import { UserService } from '../../../../services/user.service.js';
import catchAsync from '../../../../utils/catchAsync.js';
import ApiResponse from '../../../../utils/ApiResponse.js';

export const UserController = {

    getAllUsers: catchAsync(async (req, res) => {
        const users = await UserService.getAllUsers();
        res.status(200).json(new ApiResponse(200, users, "Users retrieved successfully"));
    }),

    getUserById: catchAsync(async (req, res) => {
        const user = await UserService.getUserById(req.params.id);
        res.status(200).json(new ApiResponse(200, user, "User retrieved successfully"));
    }),
};