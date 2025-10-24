import mongoose from "mongoose";
import { Order } from "../models/orders.model.js";
import ApiError from "../utils/ApiError.js";
import { CartService } from "./cart.service.js";
import bookSchema from "../models/bookSchema.js";
import * as orderEmail from "../utils/orderEmail.js"


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

  const orders = await Order.find(filter, { "__v": 0})
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


export async function createOrderFromCart(userId, billingData, paymentMethod) {
    let newOrder; 
    
    let order = await preCheckoutOrder(userId);

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            
            const createdOrders = await Order.create([
                {
                    user: userId,
                    items: order.items,
                    totalPrice: order.totalAmount,
                    status: 'pending', 
                    billingData: billingData,
                    totalItems: order.totalItems,
                    paymentMethod: paymentMethod
                }
            ], { session }); 

            newOrder = createdOrders[0]; 

            for (const item of newOrder.items) {
                const updateResult = await bookSchema.updateOne(
                    { 
                        _id: item.bookId, 
                        stock: { $gte: item.quantity } 
                    },
                    { 
                        $inc: { stock: -item.quantity } 
                    },
                    { session } 
                );

                if (updateResult.modifiedCount === 0) {
                    
                    throw new ApiError(400, `Insufficient stock for book: "${item.title}". Order rolled back.`);
                }
            }


            await CartService.clearCart(userId, { session });
        });


        orderEmail.sendPendingOrderEmail(billingData.email, newOrder)
            .catch(err => {
                console.error(`[EmailService] Failed to send 'pending' email for order ${newOrder._id}:`, err);
        });

        return newOrder;

    } catch (error) {
        if (error instanceof ApiError && error.statusCode === 400) {
            throw error; 
        }

        throw new ApiError(`Failed to create new order: ${error.message}`);

    } finally {

        session.endSession();

    }
}

// when webhook success
export async function fulfillOrder(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('Order not found.');
    }

    if (order.status === 'paid') {
        return order;
    }

    order.status = 'paid';
    await order.save();

    orderEmail.sendConfirmedOrderEmail(order.billingData.email, order)
        .catch(err => {
            console.error(`[EmailService] Failed to send 'confirmed' email for order ${order._id}:`, err);
      });

    return order;
}

export async function cancelOrderAndRestock(orderId) {

        let session;
        try {

            const order = await Order.findById(orderId);
            
            if (order && order.status === 'pending') {
                session = await mongoose.startSession();

                await session.withTransaction(async () => { 

                    order.status = 'cancelled';

                    for (const item of order.items) {
                        
                        await bookSchema.updateOne( 
                            { _id: item.bookId }, 
                            { $inc: { stock: item.quantity } }, 
                            { session } 
                        );
                    }

                    await order.save({session});
                });
            }

            orderEmail.sendCancelledOrderEmail(order.billingData.email, order)
                .catch(err => {
                    console.error(`[EmailService] Failed to send 'cancelled' email for order ${order._id}:`, err);
            });
        
        } catch (error) {
            throw new ApiError("Error processing failed payment: ", error); 
        } finally {
            if (session) {
                session.endSession();
            }        
        }
}

export async function preCheckoutOrder(userId) {
    await CartService.synchronizeCartStock(userId);

    const cart = await CartService.getUserCart(userId);


    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, 'Cart is empty.');
    }

    console.log(cart);


    let totalAmount = 0;
    let totalItems = 0;
    const orderItems = [];

    for (const item of cart.items) {
        console.log(item);

        totalAmount += item.book.price * item.quantity;
        totalItems += item.quantity; 

        orderItems.push({
            bookId: item.book._id,
            title: item.book.title,
            price: item.book.price,
            quantity: item.quantity,
        });
    }

    const order =  {
      "items": orderItems,
      "totalAmount": totalAmount,
      "totalItems": totalItems,
    }

    return order;
}