import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { productBaseURL } from "../../axiosinstance";
import { sampleImageUrls } from "./imageTestUrls";

function ProductAdd() {
  const location = useLocation();
  const navigate = useNavigate();

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Categories for pet products
  const productCategories = [
    "Food & Treats",
    "Toys",
    "Healthcare & Medicine",
    "Grooming & Hygiene",
    "Collars & Leashes",
    "Beds & Furniture",
    "Travel & Carriers",
    "Training & Behavior",
    "Bowls & Feeders",
    "Other"
  ];

  // Prefill form when editing
  useEffect(() => {
    if (location.state && location.state._id) {
      setProductForm({
        name: location.state.name || "",
        description: location.state.description || "",
        price: location.state.price || "",
        stock: location.state.stock || "",
        image: location.state.image || "",
        category: location.state.category || "",
        _id: location.state._id,
      });
      setIsUpdating(true);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!productForm.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!productForm.description.trim()) {
      newErrors.description = "Product description is required";
    }

    if (!productForm.price || productForm.price <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!productForm.stock || productForm.stock < 0) {
      newErrors.stock = "Valid stock quantity is required";
    }

    if (!productForm.image.trim()) {
      newErrors.image = "Product image URL is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        image: productForm.image.trim(),
        category: productForm.category && productForm.category.trim() !== "" ? productForm.category.trim() : "Other",
      };

      console.log("Sending product data:", productData);

      let response;
      if (isUpdating) {
        response = await productBaseURL.put(`/${productForm._id}`, productData);
      } else {
        response = await productBaseURL.post("/", productData);
      }

      console.log("Response:", response.data);

      if (response.data?.success) {
        alert(
          isUpdating 
            ? "Product updated successfully!" 
            : "Product added successfully!"
        );
        navigate("/admin/products/list");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      console.error("Error response:", error.response?.data);
      alert(
        error.response?.data?.message || 
        `Failed to ${isUpdating ? 'update' : 'add'} product. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/products/list");
  };

  return (
    <motion.div
      className="w-full px-5 py-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h2
          className="text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isUpdating ? "Update Product" : "Add New Product"}
        </motion.h2>
        <motion.button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-md transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back to Products
        </motion.button>
      </div>

      <motion.div
        className="bg-white shadow rounded-lg p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={productForm.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </motion.div>

            {/* Category */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={productForm.category || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {productCategories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (Rs.) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={productForm.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </motion.div>

            {/* Stock */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={productForm.stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </motion.div>
          </div>

          {/* Product Description */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Product Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={productForm.description}
              onChange={handleInputChange}
              rows="4"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product description..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </motion.div>

          {/* Product Image URL */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Product Image URL *
            </label>
            <input
              type="url"
              id="image"
              name="image"
              value={productForm.image}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                errors.image ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://example.com/image.jpg"
            />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
            
            {/* Image Preview */}
            {productForm.image && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
                <img 
                  src={productForm.image} 
                  alt="Product preview"
                  className="h-32 w-32 object-cover rounded-md border border-gray-200"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/128?text=Invalid+URL';
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Submit Buttons */}
          <motion.div
            className="flex gap-4 pt-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-6 py-2 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              {loading 
                ? (isUpdating ? "Updating..." : "Adding...") 
                : (isUpdating ? "Update Product" : "Add Product")
              }
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md shadow transition-colors duration-200"
            >
              Cancel
            </button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default ProductAdd;