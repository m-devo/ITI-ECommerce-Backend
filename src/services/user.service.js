import { User } from '../models/users.model.js';
import ApiError from '../utils/ApiError.js';

export const UserService = {

    async getAllUsers() {
        return User.find().select('-password');
    },

    async getUserById(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        return user;
    }
};