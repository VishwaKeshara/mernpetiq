import mongoose from "mongoose";
import Product from "../Model/ProductModel.js";


// Get All Products
export const getProducts = async (req , res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({ success: true, data: products });

    } catch (error) {
        console.error("Error in fetching products:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }

};


// Create Product
export const createProduct = async (req , res) => {
    const product = req.body; // user will send this data
    console.log("Received product data:", product);
    
    if(!product.name || !product.price || !product.image || !product.description || product.stock === undefined) {
        return res.status(400).json({ success: false, message: "All required fields must be provided (name, price, description, stock, image)" });
    }

    // Validate data types
    if(typeof product.price !== 'number' || product.price <= 0) {
        return res.status(400).json({ success: false, message: "Price must be a positive number" });
    }

    if(typeof product.stock !== 'number' || product.stock < 0) {
        return res.status(400).json({ success: false, message: "Stock must be a non-negative number" });
    }

    // Set default category if not provided
    if(!product.category || product.category.trim() === '') {
        product.category = "Other";
    }

    const newProduct = new Product(product);

    try {
        await newProduct.save();
        console.log("Product created successfully:", newProduct);
        res.status(201).json({ success: true, data: newProduct});
    
    } catch (error) {
        console.error("Error in Create Product:", error.message);
        res.status(500).json({ success: false, message: "Server Error: " + error.message });
    }

};

// Update Product
export const updateProduct = async (req , res) => {
    const { id } = req.params; // get product id from url
    // console.log("id: ", id); check if we are getting the id
    
    const product = req.body; // updated fields sent by client 

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Product Id" });
    }

    try {
        const updateProduct = await Product.findByIdAndUpdate(id, product, { new: true });
        res.status(200).json({ success: true, data: updateProduct });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error"})
    }

};


// Delete Product
export const deleteProduct = async (req , res) => {
    const {id} = req.params;
    // console.log("id: ", id); just to check if we are getting the id

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Product Id" });
    }

    try {
        await Product.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Product deleted successfully" });

    } catch (error) {
        consloe.log("Error in Delete Product:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }

};