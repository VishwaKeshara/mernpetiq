import dotenv from 'dotenv';
dotenv.config();

console.log("DEBUG STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY);

import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

import productRoutes from './routes/ProductRoute.js';
import appointmentRouter from './routes/AppointmentRoutes.js';
import medicalRecordsRouter from './routes/medicalRecords.js';
import paymentRoutes from './routes/PaymentRoutes.js'; 
import addressRoutes from './routes/AddressRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));

app.use(express.json()); 


app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/appointments", appointmentRouter);
app.use('/api/medical-records', medicalRecordsRouter);
app.use('/api/payment', paymentRoutes);
app.use('/api', addressRoutes);


app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});


app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Connect DB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server started at http://localhost:" + PORT);
    });
}).catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});