import express from 'express';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../Controllers/ProductController.js';


const router = express.Router();


// Get All Products
router.get ("/", getProducts);

// Create Product
router.post("/", createProduct);

// Update Product
router.put("/:id", updateProduct);

// Delete Product
router.delete("/:id", deleteProduct);


export default router;
