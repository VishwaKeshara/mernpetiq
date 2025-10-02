import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import productRoutes from './routes/ProductRoute.js';
import appointmentRouter from './routes/AppointmentRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Allow frontend to access backend
    credentials: true
}));
app.use(express.json()); // allows us to accept JSON data in the req.body

// Routes
app.use("/api/products", productRoutes)
app.use("/api/appointments", appointmentRouter);


app.listen(PORT, () => {
    connectDB();
    console.log("Server started at http://localhost:"+ PORT);
});


