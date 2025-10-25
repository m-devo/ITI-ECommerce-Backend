import amqp from 'amqplib';

let connection;
let channel;

export async function connectRabbitMQ() {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL;
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

export async function getChannel() {
  if (!channel) {
    await connectRabbitMQ();
  }
  return channel;
}

export async function closeRabbitMQ() {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
}