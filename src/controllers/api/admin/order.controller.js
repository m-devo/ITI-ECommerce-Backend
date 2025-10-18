import express from "express"
import mongoose from "mongoose"
import fs from 'fs'
import path from 'path'
import {Order} from '../../../models/orders.model.js'
import ApiError from "../../../utils/ApiError.js"
import ApiResponse from "../../../utils/ApiResponse.js"
import catchAsync from "../../../utils/catchAsync.js"
import { getOrdersService, updateOrderService} from "../../../services/order.service.js"

const getOrders = catchAsync(async (req, res, next) => {
  const data = await getOrdersService(req.query);

  const message = data.orders.length
    ? "Orders fetched successfully"
    : "No orders found";

  res.status(200).json(new ApiResponse(200, data, message));
});

const updateOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params; 
  const updateData = req.body; 

  const updatedOrder = await updateOrderService(id, updateData);

  if (!updatedOrder) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "Order not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedOrder, "Order updated successfully"));
});



export{
    getOrders,updateOrder
}