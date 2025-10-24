import axios from 'axios';
import crypto from 'crypto';


import paymob from '../../../../config/paymob.js';


async function _getAuthToken() {
    try {
        const response = await axios.post(
            'https://accept.paymob.com/api/auth/tokens',
            {
                api_key: paymob.apiKey,
            }
        );
        return response.data.token;
    } catch (err) {
        console.error('Paymob Auth Error:', err.response?.data);
        throw new Error('Failed to authenticate with payment provider.' + JSON.stringify(err.response?.data));
    }
}


async function _registerOrder(authToken, order) {
    const orderData = {
        auth_token: authToken,
        delivery_needed: 'false',
        amount_cents: order.totalPrice * 100,
        currency: 'EGP',
        merchant_order_id: order._id.toString(), // Order ID
        items: [],
    };

    try {
        const response = await axios.post(
            'https://accept.paymob.com/api/ecommerce/orders',
            orderData
        );

        return response.data.id; // Paymob's order ID
    } catch (err) {
        console.error('Paymob Order Registration Error:', err.response?.data);
        throw new Error('Failed to register order with payment provider.' + JSON.stringify(err.response?.data));
    }
}

async function _getPaymentKey(authToken, order, paymobOrderId) {

    
    const paymentKeyData = {
        auth_token: authToken,
        amount_cents: order.totalPrice * 100,
        expiration: 3600, // 1 hour
        order_id: paymobOrderId,
        billing_data: {
            first_name: order.billingData.firstName,
            last_name: order.billingData.lastName,
            email: order.billingData.email,
            phone_number: order.billingData.phone,
            apartment: 'NA',
            floor: 'NA',
            street: 'NA',
            building: 'NA',
            shipping_method: 'NA',
            postal_code: 'NA',
            city: order.billingData.city,
            country: order.billingData.country,
            state: order.billingData.state,
        },
        currency: 'EGP',
        integration_id: paymob.integrationId,
    };

    try {
        const response = await axios.post(
            'https://accept.paymob.com/api/acceptance/payment_keys',
            paymentKeyData
        );
        return response.data.token; // The final payment key
    } catch (err) {
        console.error('Paymob Payment Key Error:', err.response?.data);
        throw new Error('Failed to get payment key from provider.');
    }
}

export async function createPaymentIntent(order) {
    const authToken = await _getAuthToken();
    const paymobOrderId = await _registerOrder(authToken, order);
    const paymentKey = await _getPaymentKey(authToken, order, paymobOrderId);

    return {
        paymentUrl:`https://accept.paymob.com/api/acceptance/iframes/${paymob.iframeId}?payment_token=${paymentKey}`,
        transactionId: paymobOrderId
    };
}

export async function handleWebhook(webhookData) {
    const { obj } = webhookData.body;
    const hmacFromPaymob = webhookData.query.hmac;


    const concatenatedString =
        obj.amount_cents +
        obj.created_at +
        obj.currency +
        obj.error_occured +
        obj.has_parent_transaction +
        obj.id +
        obj.integration_id +
        obj.is_3d_secure +
        obj.is_auth +
        obj.is_capture +
        obj.is_refunded +
        obj.is_standalone_payment +
        obj.is_voided +
        obj.order.id +
        obj.owner +
        obj.pending +
        obj.source_data.pan +
        obj.source_data.sub_type +
        obj.source_data.type +
        obj.success;

    const calculatedHmac = crypto
        .createHmac('sha512', paymob.hmacSecret)
        .update(concatenatedString)
        .digest('hex');

    // Compare HMACs
    if (calculatedHmac !== hmacFromPaymob) {
        console.warn('HMAC validation failed for Paymob webhook.');
        return {
            success: false,
            orderId: obj.order.merchant_order_id,
            message: 'Invalid HMAC signature.',
        };
    }

    return {
        success: obj.success,
        orderId: obj.order.merchant_order_id, // order ID
        message: obj.data?.message || (obj.success ? 'Payment successful' : 'Payment failed'),
    };
}



export async function getTransactionStatus(transactionId) {
    if (!transactionId) {
        console.log('[PaymobService] getTransactionStatus: No transaction ID provided. Assuming failed.');
        return { success: false, message: 'No transaction ID recorded.' };
    }

    try {

        const authToken = await _getAuthToken();

        if (!authToken) {
            return { success: false, message: 'Failed to authenticate with Paymob.' };
        }

        const response = await axios.post(
            'https://accept.paymob.com/api/ecommerce/orders/transaction_inquiry', 
            
            {
                'order_id': transactionId 
            },
            
            { 
                headers: {
                    'Authorization': `Bearer ${authToken}` 
                }
            }
        );

        const transactionData = response.data;

        return {
            success: transactionData.success === true,
            message: transactionData.data?.message || (transactionData.success ? 'Payment successful' : 'Payment failed'),
        };

    } catch (error) {
        console.log(`[PaymobService] Error checking status for Txn ${transactionId}:`, error.response?.data || error.message);
        return { success: false, message: 'Failed to query transaction status from Paymob.' };
    }
}