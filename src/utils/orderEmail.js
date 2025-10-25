import transporter from '../../config/mailer.js';


//Sends pending order
export async function sendPendingOrderEmail(userEmail, order) {
    let subject, message;

    if (order.paymentMethod === 'cod') {
        subject = `eBook Store order #${order._id} is pending delivery`;
        message = `Your order #${order._id} for ${order.totalPrice} EGP is pending delivery. Payment will be collected upon receipt.`;
    } else {
        subject = `eBook Store order #${order._id} is pending payment`;
        message = `Your order #${order._id} for ${order.totalPrice} EGP is pending payment.`;
    }

    const mailOptions = {
        from: '"eBook Store" <no-reply@yourstore.com>',
        to: userEmail,
        subject: subject,
        html: `
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #333;">Order Pending</h1>
                <p>Hi ${order.billingData.firstName},</p>
                <p>${message}</p>
                <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} eBook Store</p>
            </body>
        `,
    };

    return transporter.sendMail(mailOptions);
}


// Sends confirmed Order
export async function sendConfirmedOrderEmail(userEmail, order) {
    const mailOptions = {
        from: '"eBook Store" <no-reply@yourstore.com>',
        to: userEmail,
        subject: `eBook Store order #${order._id} is confirmed!`,
        html: `
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #28a745;">Payment Confirmed!</h1>
                <p>Hi ${order.billingData.firstName},</p>
                <p>Your order #${order._id} for ${order.totalPrice} EGP has been confirmed.</p>
                <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} eBook Store</p>
            </body>
        `,
    };
    return transporter.sendMail(mailOptions);
}

//Sends cancelled Order email
export async function sendCancelledOrderEmail(userEmail, order) {
    const mailOptions = {
        from: '"eBook Store" <no-reply@yourstore.com>',
        to: userEmail,
        subject: `eBook Store order #${order._id} has been cancelled`,
        html: `
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #dc3545;">Order Cancelled</h1>
                <p>Hi ${order.billingData.firstName},</p>
                <p>Your order #${order._id} has been cancelled.</p>
                <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} eBook Store</p>
            </body>
        `,
    };
    return transporter.sendMail(mailOptions);
}

