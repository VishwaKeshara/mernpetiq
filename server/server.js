import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import productRoutes from './routes/ProductRoute.js';


dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // allows us to accept JSON data in the req.body

app.use("/api/products", productRoutes)


app.listen(5000, () => {
    connectDB();
    console.log("Server started at http://localhost:5000");
});


