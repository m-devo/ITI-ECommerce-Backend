import { Order } from '../models/orders.model.js';
import { User } from '../models/users.model.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

export const UserService = {

  async getAllUsers(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const users = await User.find(filters,{"__v":0,"verificationToken":0,
      "verificationTokenExpires":0,"activeSessionToken":0,"updatedAt":0})
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
    const user = await User.findById(userId,{"__v":0,"verificationToken":0,
      "verificationTokenExpires":0,"activeSessionToken":0,"updatedAt":0}).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  },
  async updateUser(userId) {
     const user = await User.findById(userId,{"__v":0,"verificationToken":0,
      "verificationTokenExpires":0,"activeSessionToken":0,"updatedAt":0}).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  },

  async getUserProfile(userId) {
    const user = await User.findById(userId).select(
      'firstName lastName email role isVerified isSubscribedToNewsService'
    );

    return user;
  },


  async getUserOrders(userId) {
    const orders = await Order.find({ user: userId })
                              .sort({ createdAt: -1 });

    return orders;
  },

  async getUserBooks(userId) {

    const aggregationPipeline = [
      {
        $match: {
          user: new ObjectId(userId),
          status: "paid"
        }
      },
      {
        $unwind: "$items"
      },
      {

        $group: {
          _id: "$items.bookId"
        }
      },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "bookDetails"
        }
      },
      {
        $unwind: "$bookDetails"
      },
      {
        $replaceRoot: { newRoot: "$bookDetails" }
      }
    ];

    const books = await Order.aggregate(aggregationPipeline);

    return books;
  }
};



