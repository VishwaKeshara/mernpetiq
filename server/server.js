import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';

import productRoutes from './routes/ProductRoute.js';
import appointmentRouter from './routes/AppointmentRoutes.js';
import medicalRecordsRouter from './routes/medicalRecords.js';
import paymentRoutes from './routes/PaymentRoutes.js';
import adminPaymentRoutes from './routes/AdminPaymentRoutes.js';
import publicAdminRoutes from './routes/PublicAdminRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow frontend to access backend
    credentials: true
}));
app.use(express.json()); // allows us to accept JSON data in the req.body

// Add enhanced logging middleware with payment routes highlighted
app.use((req, res, next) => {
    const isPossiblePaymentRoute = req.path.includes('payment') || req.path === '/payments';
    const logPrefix = isPossiblePaymentRoute ? '🔴 PAYMENT ROUTE:' : '🔹 Route:';
    
    console.log(`${logPrefix} ${new Date().toISOString()} - ${req.method} ${req.path} - Headers:`, 
        JSON.stringify({
            host: req.headers.host,
            'user-agent': req.headers['user-agent']
        })
    );
    next();
});

// Remove all previous debug routes

// We are going to try one more approach by removing the other address routes

// Import Address model directly
import Address from './Model/AddressModel.js';

// Direct address routes - support BOTH /addresses and /api/addresses paths
const handleGetAddresses = async (req, res) => {
    try {
        console.log("GET addresses route with userId:", req.query.userId);
        const userId = String(req.query.userId || "guest");
        const docs = await Address.find({ userId }).sort({ createdAt: 1 });
        console.log(`Found ${docs.length} addresses for user ${userId}`);
        res.json(docs);
    } catch (e) {
        console.error("Error in GET addresses:", e);
        res.status(500).json({ error: "SERVER_ERROR", message: e.message });
    }
};

const handlePostAddress = async (req, res) => {
    try {
        console.log("POST address with body:", req.body);
        const userId = String(req.body.userId || "guest");
        const count = await Address.countDocuments({ userId });
        
        if (count >= 3) {
            return res.status(409).json({
                error: "MAX_LIMIT_REACHED",
                message: "You can only add up to 3 delivery addresses."
            });
        }
        
        const doc = await Address.create({
            userId,
            firstName: req.body.firstName?.trim(),
            lastName: req.body.lastName?.trim(),
            phone: String(req.body.phone || "").replace(/\D/g, ""),
            line1: req.body.line1?.trim(),
            line2: String(req.body.line2 || "").trim(),
            city: req.body.city?.trim(),
            state: req.body.state?.trim(),
            postalCode: String(req.body.postalCode || "").replace(/\D/g, ""),
            country: String(req.body.country || "Sri Lanka").trim(),
        });
        
        console.log("Address created:", doc);
        res.status(201).json(doc);
    } catch (e) {
        console.error("Error in POST address:", e);
        res.status(500).json({ error: "SERVER_ERROR", message: e.message });
    }
};

const handlePatchAddress = async (req, res) => {
    try {
        console.log("PATCH address/:id with params:", req.params, "and body:", req.body);
        const id = req.params.id;
        const userId = String(req.body.userId || "guest");
        
        const doc = await Address.findOneAndUpdate(
            { _id: id, userId },
            {
                $set: {
                    firstName: req.body.firstName?.trim(),
                    lastName: req.body.lastName?.trim(),
                    phone: String(req.body.phone || "").replace(/\D/g, ""),
                    line1: req.body.line1?.trim(),
                    line2: String(req.body.line2 || "").trim(),
                    city: req.body.city?.trim(),
                    state: req.body.state?.trim(),
                    postalCode: String(req.body.postalCode || "").replace(/\D/g, ""),
                    country: String(req.body.country || "Sri Lanka").trim(),
                }
            },
            { new: true }
        );
        
        if (!doc) return res.status(404).json({ error: "NOT_FOUND" });
        
        console.log("Address updated:", doc);
        res.json(doc);
    } catch (e) {
        console.error("Error in PATCH address/:id:", e);
        res.status(500).json({ error: "SERVER_ERROR", message: e.message });
    }
};

const handleDeleteAddress = async (req, res) => {
    try {
        console.log("DELETE address/:id with params:", req.params, "and query:", req.query);
        const id = req.params.id;
        const userId = String(req.query.userId || req.body.userId || "guest");
        
        const doc = await Address.findOneAndDelete({ _id: id, userId });
        
        if (!doc) return res.status(404).json({ error: "NOT_FOUND" });
        
        console.log("Address deleted:", doc);
        res.json({ ok: true, deletedId: id });
    } catch (e) {
        console.error("Error in DELETE address/:id:", e);
        res.status(500).json({ error: "SERVER_ERROR", message: e.message });
    }
};

// Create an Express router for address endpoints
const addressRouter = express.Router();

// Define routes on the router
addressRouter.get('/', handleGetAddresses);
addressRouter.post('/', handlePostAddress);
addressRouter.patch('/:id', handlePatchAddress);
addressRouter.delete('/:id', handleDeleteAddress);

// Mount the router at both paths
app.use('/addresses', addressRouter);
app.use('/api/addresses', addressRouter);

// Add debug route to test basic route functionality
app.get('/test-route', (req, res) => {
  res.json({ success: true, message: 'Test route working' });
});

// Direct import of payment controller for admin dashboard
import { getAdminPaymentsNoAuth } from './Controllers/PaymentControllers.js';

// Direct route for admin payments - guaranteed to work
app.get('/direct-admin-payments', (req, res) => {
  console.log("🔴 DIRECT ADMIN PAYMENTS ROUTE HIT");
  getAdminPaymentsNoAuth(req, res);
});

// Add a test route that's guaranteed to work
app.get('/test-admin-payments', (req, res) => {
  console.log("🔴 TEST ADMIN PAYMENTS ROUTE HIT");
  res.json({ success: true, message: "Test admin payments endpoint working", timestamp: new Date().toISOString() });
});

// Other API routes
app.use("/api/products", productRoutes)
app.use("/api/appointments", appointmentRouter);
app.use('/api/medical-records', medicalRecordsRouter);
app.use('/', paymentRoutes);

// Mount admin routes
app.use('/api/admin', adminPaymentRoutes);

// Mount public admin routes - no authentication required
app.use('/', publicAdminRoutes);

// Let's try a different approach

// Add a catch-all handler to debug which routes are not being matched
app.use((req, res) => {
    console.log(`Route not found: ${req.method} ${req.path}`);
    console.log("Request query params:", req.query);
    console.log("Request headers:", req.headers);
    
    // Check if this is an address-related route that wasn't matched
    if (req.path === '/addresses' || req.path.startsWith('/addresses/') || 
        req.path === '/api/addresses' || req.path.startsWith('/api/addresses/')) {
        console.error("⚠️ ADDRESS ROUTE NOT MATCHED:", req.method, req.path);
    }
    
    res.status(404).json({ success: false, message: 'Route not found' });
});


app.listen(PORT, () => {
    connectDB();
    console.log("Server started at http://localhost:"+ PORT);
});


