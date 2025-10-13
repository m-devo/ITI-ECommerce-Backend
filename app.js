
import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import errorHandler from './src/middlewares/error.middleware.js';
import userRoutes from './src/routes/user.routes.js';
import authRouter from "./src/routes/auth.route.js";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import cartRoutes from './src/routes/cart.route.js';
import { isAuth } from './src/middlewares/isAuth.middleware.js';

const app = express();
const PORT = process.env.PORT || 4000; 

connectDB();

app.use(express.json());

app.use(errorHandler);

// auth routes
app.use('/api/auth', authRouter);

// cart routes
app.use('/api/cart', isAuth, cartRoutes);

// #todo check is admin middleware
app.use('/api/admin/users', userRoutes);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});