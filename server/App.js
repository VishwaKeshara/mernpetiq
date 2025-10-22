import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import registerRoutes from './routes/registerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import petRoutes from './routes/petRoutes.js';
import appointmentRoutes from './routes/AppointmentRoutes.js';
import productRoutes from './routes/ProductRoute.js';
import medicalRecordsRoutes from './routes/medicalRecords.js';
import paymentRoutes from './routes/PaymentRoutes.js';

// Direct import of payment controller for admin dashboard
import { getAdminPaymentsNoAuth, deleteAdminPaymentsNoAuth } from './Controllers/PaymentControllers.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/register', registerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api', paymentRoutes);

// Direct route for admin payments - guaranteed to work
app.get('/direct-admin-payments', (req, res) => {
  console.log("🔴 DIRECT ADMIN PAYMENTS ROUTE HIT", { query: req.query });
  getAdminPaymentsNoAuth(req, res);
});

// Direct route for admin payments deletion - guaranteed to work
app.post('/direct-admin-payments-delete', (req, res) => {
  console.log("🔴 DIRECT ADMIN PAYMENTS DELETE ROUTE HIT", { body: req.body });
  deleteAdminPaymentsNoAuth(req, res);
});

// Add a test route that's guaranteed to work
app.get('/test-admin-payments', (req, res) => {
  console.log("🔴 TEST ADMIN PAYMENTS ROUTE HIT");
  res.json({ success: true, message: "Test admin payments endpoint working", timestamp: new Date().toISOString() });
});

// Health check route
app.get('/', (req, res) => {
    res.json({ 
        message: 'PetIQ Server is running!', 
        status: 'OK',
        database: 'petipDB',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Internal server error' 
    });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/petipDB';

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully to local MongoDB - petipDB database!');
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📡 API endpoints:`);
            console.log(`   - Registration: http://localhost:${PORT}/api/register`);
            console.log(`   - Admin: http://localhost:${PORT}/api/admin`);
            console.log(`   - Pets: http://localhost:${PORT}/api/pets`);
            console.log(`   - Products: http://localhost:${PORT}/api/products`);
            console.log(`   - Appointments: http://localhost:${PORT}/api/appointments`);
            console.log(`   - Medical Records: http://localhost:${PORT}/api/medical-records`);
            console.log(`   - Payments: http://localhost:${PORT}/api/payment-methods`);
            console.log(`📦 Database: Local MongoDB - petipDB`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

export default app;

