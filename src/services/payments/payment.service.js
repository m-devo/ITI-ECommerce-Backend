import * as paymobProvider from './providers/paymob.js';
import { Order } from '../../models/orders.model.js';
import * as orderService from '../order.service.js';
import bookSchema from '../../models/bookSchema.js';
import mongoose from "mongoose";
import ApiError from '../../utils/ApiError.js';

// available payment provider
const providers = {
    'paymob': paymobProvider,
};


export async function createPaymentIntent(order, providerName) {
    const provider = providers[providerName];
    if (!provider) {
        throw new Error(`Payment provider "${providerName}" is not supported.`);
    }

    const paymentData = await provider.createPaymentIntent(order);
    
    order.paymentMethod = providerName;
    order.paymentTransactionId = paymentData.transactionId;
    await order.save();

    return paymentData.paymentUrl;
}


export async function handleWebhook(providerName, requestData) {
    const provider = providers[providerName];
    if (!provider) {
        throw new Error(`Provider "${providerName}" not found.`);
    }

    const result = await provider.handleWebhook(requestData);

    if (result.success) {
        // Payment Success
        await orderService.fulfillOrder(result.orderId);
    } else {
        // Payment Failed
        await orderService.cancelOrderAndRestock(result.orderId);
    }
    
    return result;
}



export async function getPaymentStatusForOrder(order) {
    if (!order.paymentMethod) {
        throw new ApiError(`Order ${order._id} has no paymentMethod.`);
    }
    if (!order.paymentTransactionId) {
        return { success: false, message: 'No transaction ID found for order.' };
    }

    const provider = providers[order.paymentMethod];
    if (!provider) {
        throw new ApiError(`Provider "${order.paymentMethod}" not found.`);
    }
    if (typeof provider.getTransactionStatus !== 'function') {
        throw new ApiError(`Provider "${order.paymentMethod}" does not support getTransactionStatus.`);
    }

    return provider.getTransactionStatus(order.paymentTransactionId);
}