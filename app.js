
import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import errorHandler from './src/middlewares/error.middleware.js';
import userRoutes from './src/routes/user.routes.js';
import authRouter from "./src/routes/auth.route.js";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import searchRoutes from "./src/routes/fullTextSearch.route.js";
import bookRouter from "./src/routes/book.route.js";
import path from 'path';
import "./src/services/stock.service.js";
import { fileURLToPath } from 'url';
const app = express();
const PORT = process.env.PORT || 4000;

connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.urlencoded({ extended: true }));
app.use('/api/public/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.json());
// auth routes
app.use('/api/auth', authRouter);

// #todo check is admin middleware
app.use('/api/admin/users', userRoutes);
// book routes
app.use('/api/admin/book',bookRouter)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use((req, res, next) => {
    return res.status(404).json({
        status: 'fail',
        message: 'Route is not found'
    });
});
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
////////////////////////////////////////////////////////////////////////////////////////
app.use("/api", searchRoutes);

app.get("/", (req, res) => res.send("Bookstore Search API Running..."));


// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
