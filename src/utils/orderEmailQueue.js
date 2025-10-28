import { getChannel } from '../../config/rabbitmq.js';

const EMAIL_QUEUE = 'order_emails';

export async function sendEmailToQueue(emailType, email, order) {
  const channel = await getChannel();

  await channel.assertQueue(EMAIL_QUEUE, { durable: true });

  const message = {
    type: emailType, // 'pending', 'confirmed', 'cancelled'
    email,
    order: {
      _id: order._id,
      totalPrice: order.totalPrice,
      billingData: order.billingData
    }
  };

  channel.sendToQueue(EMAIL_QUEUE, Buffer.from(JSON.stringify(message)), {
    persistent: true
  });

  console.log(`Email message sent to queue: ${emailType} for order ${order._id}`);
}

export async function consumeEmailQueue() {
  const channel = await getChannel();

  await channel.assertQueue(EMAIL_QUEUE, { durable: true });

  channel.consume(EMAIL_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const message = JSON.parse(msg.content.toString());
        console.log('Processing email message:', message);

        // import order email
        const { sendPendingOrderEmail, sendConfirmedOrderEmail, sendCancelledOrderEmail } = await import('./orderEmail.js');

        switch (message.type) {
          case 'pending':
            await sendPendingOrderEmail(message.email, message.order);
            break;
          case 'confirmed':
            await sendConfirmedOrderEmail(message.email, message.order);
            break;
          case 'cancelled':
            await sendCancelledOrderEmail(message.email, message.order);
            break;
          default:
            console.error('Unknown email type:', message.type);
        }

        channel.ack(msg);
      } catch (error) {
        console.error('Error processing email message:', error);

        channel.nack(msg, false, false);
      }
    }
  }, { noAck: false });

  console.log('Email consumer started');
}