import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import registerRoutes from './routes/registerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import petRoutes from './routes/petRoutes.js';
import appointmentRoutes from './routes/AppointmentRoutes.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/register', registerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pets', petRoutes);
app.use('/appointments', appointmentRoutes);

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

const PORT = process.env.PORT || 3000;
const MONGODB_URI = 'mongodb+srv://admin:ICREf1Yx8Mb0GcXt@cluster0.9fyuypo.mongodb.net/petipDB';

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully to petipDB database!');
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📡 API endpoints available:`);
            console.log(`   - Registration: http://localhost:${PORT}/api/register`);
            console.log(`   - Admin: http://localhost:${PORT}/api/admin`);
            console.log(`   - Pets: http://localhost:${PORT}/api/pets`);
            console.log(`   - Appointments: http://localhost:${PORT}/appointments`);
            console.log(`📦 Database: petipDB`);
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
