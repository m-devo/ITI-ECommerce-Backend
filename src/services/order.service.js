import mongoose from "mongoose";
import { Order } from "../models/orders.model.js";
import ApiError from "../utils/ApiError.js";

export const getOrdersService = async (query) => {
  const limit = Math.max(parseInt(query.limit) || 10, 1);
  const page = Math.max(parseInt(query.page) || 1, 1);
  const sortField = query.sortBy || "createdAt";
  const sortOrder = query.order === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;

  const { status, user, book } = query;
  const filter = {};

  if (status) filter.status = status;

  if (user) {
    if (!mongoose.Types.ObjectId.isValid(user)) throw new ApiError(400, "Invalid user ID");
    filter.user = new mongoose.Types.ObjectId(user);
  }

  if (book) {
    if (!mongoose.Types.ObjectId.isValid(book)) throw new ApiError(400, "Invalid book ID");
    filter["items.bookId"] = new mongoose.Types.ObjectId(book);
  }

  const totalOrders = await Order.countDocuments(filter);

  const orders = await Order.find(filter, { "__v": 0, "_id": 0 })
    .populate("user", "name email -_id")
    .populate("items.bookId", "title author -_id")
    .sort({ [sortField]: sortOrder })
    .limit(limit)
    .skip(skip)
    .lean();

  return {
    totalOrders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
    pageSize: limit,
    orders,
  };
};


export const updateOrderService = async (orderId, updateData) => {
  const order = await Order.findById(orderId);

  if (!order) {
    return null; 
  }

  Object.assign(order, updateData);

  const updatedOrder = await order.save();

  return updatedOrder;
};