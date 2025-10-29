import catchAsync from '../../../utils/catchAsync.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import * as orderService from '../../../services/order.service.js';
import * as paymentService from '../../../services/payments/payment.service.js';
import redisClient from '../../../../config/redis.js';



export const CheckoutController = {

    preCheckout: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const cart = await orderService.preCheckoutOrder(userId);
        res.status(200).json(new ApiResponse(200, cart, "Pre Checkout retrieved successfully"));
    }),


    createCheckoutSession: catchAsync(async (req, res) => {
        const userId = req.currentUser.id;
        const { billingData, paymentMethod } = req.body;

        // Get user details to populate billingData
        const { User } = await import("../../../models/users.model.js");
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Populate billingData from user profile
        const completeBillingData = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: billingData.phone,
            country: billingData.country,
            state: billingData.state,
            city: billingData.city
        };

        const order = await orderService.createOrderFromCart(userId, completeBillingData, paymentMethod);

        if (paymentMethod == "cod") {
            return  res.status(201).json(new ApiResponse(201, null, "Order Created"));
        }


        const paymentUrl = await paymentService.createPaymentIntent(order, paymentMethod);


        const responseData = {
            paymentUrl: paymentUrl,
            orderId: order._id
        };

        const { idempotencyKey } = res.locals;
        if (idempotencyKey) {
            await redisClient.set(idempotencyKey, JSON.stringify(responseData), {
                EX: 3600
            });
        }

        res.status(201).json(new ApiResponse(201, {paymentUrl: paymentUrl} , "Payment Url Received"));
    }),

    handlePaymentWebhook: catchAsync(async (req, res) => {


        const providerName = req.params.provider;
        const requestData = {
            body: req.body,
            query: req.query,
            headers: req.headers,
        };

        await paymentService.handleWebhook(providerName, requestData);

        res.status(200).send('Webhook received.');
    }),
}