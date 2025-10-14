import { UserService } from '../../../services/user.service.js';
import catchAsync from '../../../utils/catchAsync.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import {User} from '../../../models/users.model.js';
import nodemailer from 'nodemailer';
import {sendAccountDeleteEmail} from '../../../utils/sendEmail.js';
export const UserController = {

  getAllUsers: catchAsync(async (req, res) => {
    const { page = 1, limit = 10, ...filters } = req.query;
    const queryFilters = {};
    Object.keys(filters).forEach((key) => {
      queryFilters[key] = { $regex: filters[key], $options: 'i' };
    });

    const usersData = await UserService.getAllUsers(queryFilters, page, limit);

    res.status(200).json(
      new ApiResponse(200, usersData, "Users retrieved successfully")
    );
  }),

  getUserById: catchAsync(async (req, res) => {
    const user = await UserService.getUserById(req.params.id);
    res.status(200).json(new ApiResponse(200, user, "User retrieved successfully"));
  }),
  updateUser: catchAsync(async (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    const user = await  User.findByIdAndUpdate(id, updates,{
      new: true,
      reqnValidators: true
    })
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
  }),
  deleteUser: catchAsync(async (req, res,next) => {
    const id  = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    await User.findByIdAndDelete(id);
    await sendAccountDeleteEmail(user.email,"Violation of our policies." );
    res.status(200).json(new ApiResponse(200, user, "User deleted successfully"));
  })

};