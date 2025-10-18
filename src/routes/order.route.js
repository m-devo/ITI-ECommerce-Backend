import express from "express";
import { 
  getOrders, updateOrder
 } from "../controllers/api/admin/order.controller.js";
import restrictTo from '../middlewares/restrictTo.middleware.js';
import protect  from "../middlewares/protect.middleware.js";

const orderRouter = express.Router();
orderRouter.get('/allOrders', protect,restrictTo('admin'),getOrders)

orderRouter.patch('/update/:id',protect,restrictTo('admin'),updateOrder)

export default orderRouter;