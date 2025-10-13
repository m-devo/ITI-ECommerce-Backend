import { User } from '../models/users.model.js';
import ApiError from '../utils/ApiError.js';

export const UserService = {

  async getAllUsers(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const users = await User.find(filters)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filters);

    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      users
    };
  },

  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  },
  async updateUser(userId) {
     const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }
};



