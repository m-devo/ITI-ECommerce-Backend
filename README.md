# ITI-Books-Ecommerce-Backend

This is a backend project for ITI using NodeJS. It handles user authentication, book management, cart, orders, payments, reviews, news, reports, services and notifications for an online bookstore.

## Table of Contents
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Documentation & Testing](#api-documentation--testing)
- [Features](#features)
- [Project Structure](#project-structure)
- [Background Jobs & Services](#background-jobs--services)
- [Scripts](#scripts)
- [License](#license)

## Installation

Follow these steps to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18.x or later recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (local instance or a cloud-hosted solution like MongoDB Atlas)
- [npm](https://www.npmjs.com/) 

### Steps

1. Clone the repository:
```bash
git clone https://github.com/m-devo/ITI-Books-Ecommerce-Backend.git
```
2. Navigate to the project directory:
```bash
cd ITI-Books-Ecommerce-Backend
```
3. Install the dependencies:
```bash
npm install
```
4. Create a `.env` file in the root of the project and add the necessary environment variables. You can use the `.env.example` as a template.

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file. Create a `.env` file in the root directory and copy the contents of `.env.example` or add the variables manually.

```bash
# Server Configuration
NODE_ENV=development
MONGO_URL=
PORT=4000
JWT_SECRET_KEY=
BASE_URL=
EMAIL_USER=
EMAIL_PASS=
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
#PAYMOB
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=
#REDIS
REDIS_URL="redis://localhost:6379/"
#AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY= 
AWS_REGION=us-east-1
AWS_BUCKET_NAME=
```

## Usage

You can run the server in development mode or production mode.

**Development Mode**

This command starts the server with `nodemon`, which will automatically restart the server on file changes.

```bash
npm run dev
```
**Production Mode**

This command starts the server in production mode.

```bash
npm start
```

The server will be running on `http://localhost:4000` or the port you specified in your `.env` file.

## API Documentation & Testing

This project uses Swagger for API documentation. Once the server is running, u can access sawagger API documentation by navigating to:

http://localhost:4000/api-docs

The documentation provides detailed information about all available endpoints, their parameters, and expected responses.

## Features

This project is packed with features designed to provide a complete and modern e-commerce experience.

- **Secure User Authentication**:
  - **JWT-Based Sessions**: Stateless authentication using JSON Web Tokens (JWT) for secure API access.
  - **Password Management**: Passwords are securely hashed using `bcrypt`. Includes a robust password reset flow via email tokens.
  - **Role-Based Access Control**: Differentiated access permissions for regular users and administrators.

- **Social Login**
  - **Google OAuth 2.0**: Seamless user login and registration using Google accounts, powered by `passport.js`.

- **Comprehensive Book Management (Admin)**:
  - **Full CRUD Operations**: Administrators can create, read, update, and delete books from the catalog.
  - **Image and PDFS Uploads**: Book cover images and pdfs can be uploaded and managed using `multer`.

- **Advanced Search and Discovery**:
  - **Multi-field Search**: Users can search for books by title, author, and category.
  - **Filtering & Sorting**: API endpoints support filtering by price.

- **Persistent Shopping Cart**:
  - **Database-Backed**: For authenticated users, the shopping cart is saved to the database, ensuring it persists across sessions and devices and cached as well with redis.
  - **Dynamic Updates**: Users can easily add, remove, and update the quantity of items in their cart.

- **End-to-End Order Processing**:
  - **Complete Workflow**: Manages the entire order lifecycle, from checkout to payment confirmation and fulfillment.
  - **Secure Payments**: Integrated with the **Paymob** payment gateway for handling online transactions securely.

- **AI-Powered Enhancements**:
  - **Audio Transcription**: Leverages the **Deepgram API** for transcribing audio content.

- **Robust Background Processing**:
  - **Scheduled Jobs**: Uses `node-cron` to run scheduled tasks for sending periodic emails (like cart reminders, stock warns) and generating daily/monthly reports.
  - **Email Notifications**: Asynchronous email delivery with `Nodemailer` for events like user registration and confirmation.

- **Performance and Scalability**:
  - **Redis Caching**: Implements a Redis caching layer to reduce database load and speed up data responses.
  - **Optimized Queries**: Mongoose schemas and queries are designed for efficient data retrieval.

## Project Structure

The project follows this structure

```ITI_Books-Ecommerce-Backed/
├── config/
├── docs/
├── public/
├── src/
│   ├── controllers/
│   │   ├── api/
│   │   ├── review/
│   │   └── search/
│   │
│   ├── jobs/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── seeders/
│   ├── services/
│   ├── utils/
│   └── validations/
│
├── app.js
├── package.json
└── README.md
```

## Background Jobs & Services

The application relies on scheduled jobs and asynchronous services to automate tasks, improve performance, and enhance user engagement.

### Scheduled Jobs (`node-cron`)

These automated tasks run at specified intervals to maintain the application and interact with users.

- **Daily Sales Report Generation**: A cron job runs every night to process the day's orders and generate a comprehensive sales report, which is then available for administrators.
- **Abandoned Cart Reminders**: The system periodically checks for carts that have items but have not proceeded to checkout. A scheduled job sends a friendly reminder email to these users to encourage them to complete their purchase.
- **Low Stock Warnings**: An automated job monitors book inventory levels and sends notification emails to administrators when stock for a particular book falls below a predefined threshold.

### Email Services (`Nodemailer`)

All email notifications are sent asynchronously to ensure that API response times are not affected. The service handles various communication events:

- **User Onboarding**:
  - **Welcome & Verification Email**: Sent to new users upon registration to verify their email address.
- **User Account Management**:
  - **Password Reset**: Securely sends a tokenized link to users who request a password reset.
- **E-Commerce Notifications**:
  - **Order Confirmation**: Sent to a user immediately after a successful purchase, containing their order details.
- **Engagement & Marketing**:
  - **Newsletter**: Delivers news and promotional content to users who have subscribed.
  - **Cart Reminders & Stock Alerts**: Sends the reminder and warning emails generated by the corresponding cron jobs.

## Scripts

Here are some of the main scripts available in `package.json`:

- `npm start`: Starts the server in production mode.
- `npm run dev`: Starts the server in development mode with `nodemon`.

## License

This project is licensed under the MIT License. 
