import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import productRoutes from './routes/ProductRoute.js';
import appointmentRouter from './routes/AppointmentRoutes.js';
import medicalRecordsRouter from './routes/medicalRecords.js';
import paymentRoutes from './routes/PaymentRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow frontend to access backend
    credentials: true
}));
app.use(express.json()); // allows us to accept JSON data in the req.body

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use("/api/products", productRoutes)
app.use("/api/appointments", appointmentRouter);
app.use('/api/medical-records', medicalRecordsRouter);
app.use('/', paymentRoutes);


app.listen(PORT, () => {
    connectDB();
    console.log("Server started at http://localhost:"+ PORT);
});


