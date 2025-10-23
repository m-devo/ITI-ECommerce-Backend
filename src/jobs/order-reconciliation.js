import cron from 'node-cron';
import { Order } from '../models/orders.model.js'; 

import { getPaymentStatusForOrder } from '../services/payments/payment.service.js';
import * as orderService from '../services/order.service.js';


async function reconcilePendingOrders() {
    console.log('[CronJob] Running reconciliation for pending orders...');

    const beforeOneHour = new Date(Date.now() - (60 * 60 * 1000));

    let pendingOrders = [];
    try {
        pendingOrders = await Order.find({
            status: 'pending',
            createdAt: { $lte: beforeOneHour },
            paymentMethod: { $exists: true, $ne: null },
            paymentTransactionId: { $exists: true, $ne: null }
        }).limit(100);

        if (pendingOrders.length === 0) {
            console.log('[CronJob] No pending orders found.');
            return;
        }

        console.log(`[CronJob] Found ${pendingOrders.length} orders to reconcile.`);

    } catch (e) {
        console.error('[CronJob] Error fetching pending orders:', e.message);
        return; 
    }

    for (const order of pendingOrders) {
        try {
            console.log(`[CronJob] Checking status for Order ID: ${order._id} (Provider: ${order.paymentMethod})`);


            const paymentStatus = await getPaymentStatusForOrder(order);

            if (paymentStatus.success) {
                // Payment successful, fulfill the order
                await orderService.fulfillOrder(order._id);
                console.log(`[CronJob] Order ${order._id} reconciled to 'paid'.`);
            } else {
                // Payment failed, cancel the order and restock
                console.log(`[CronJob] Order ${order._id} reconciled to 'failed'.`);
                
                await orderService.cancelOrderAndRestock(order); 
            }

        } catch (checkError) {
            console.error(`[CronJob] Failed to reconcile order ${order._id}:`, checkError.message);
        }
    }

    console.log('[CronJob] Reconciliation job finished.');
}


export default function startReconciliationCron() {
    // Schedule to run every 15 minutes
    cron.schedule('*/15 * * * *', reconcilePendingOrders);
    console.log('Pending Order Reconciliation Cron Job scheduled.');
}