import mongoose  from "mongoose";

const productSchema = new mongoose.Schema({
    name :{
        type: String,
        required: true
    },
    
    price:{
        type: Number,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: false,
        default: "Other"
    },

    stock: {
        type: Number,
        required: true,
        min: 0
    },

    image: {
        type: String,
        required: true
    },

}, {
    timestamps: true // createdAt, updatedAt
});

const Product = mongoose.model('Product', productSchema);

export default Product;