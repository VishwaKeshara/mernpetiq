import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { productBaseURL } from "../../axiosinstance.js";

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
      className="min-h-screen w-full px-5 py-6 bg-gray-50"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <motion.h2
            className="text-3xl font-bold text-gray-800"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {isUpdating ? "Update Product" : "Add New Product"}
          </motion.h2>
          <motion.button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800 px-6 py-3 border border-gray-300 rounded-lg transition-colors duration-200 bg-white shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back to Products
          </motion.button>
        </div>

        <motion.div
          className="bg-white shadow-xl rounded-2xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Name */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={productForm.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                          errors.name ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Enter product name"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
                    </motion.div>

                    {/* Category */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-3">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={productForm.category || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent hover:border-gray-300 transition-all duration-200"
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
                      <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-3">
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
                        className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                          errors.price ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                      {errors.price && <p className="text-red-500 text-sm mt-2">{errors.price}</p>}
                    </motion.div>

                    {/* Stock */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-3">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={productForm.stock}
                        onChange={handleInputChange}
                        min="0"
                        className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                          errors.stock ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="0"
                      />
                      {errors.stock && <p className="text-red-500 text-sm mt-2">{errors.stock}</p>}
                    </motion.div>
                  </div>

                  {/* Product Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
                      Product Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={productForm.description}
                      onChange={handleInputChange}
                      rows="6"
                      className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 resize-none ${
                        errors.description ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter detailed product description..."
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-2">{errors.description}</p>}
                  </motion.div>

                  {/* Product Image URL */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <label htmlFor="image" className="block text-sm font-semibold text-gray-700 mb-3">
                      Product Image URL *
                    </label>
                    <input
                      type="url"
                      id="image"
                      name="image"
                      value={productForm.image}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                        errors.image ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="https://example.com/image.jpg"
                    />
                    {errors.image && <p className="text-red-500 text-sm mt-2">{errors.image}</p>}
                  </motion.div>
                </div>

                {/* Right Column - Image Preview */}
                <motion.div
                  className="lg:col-span-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="sticky top-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Image Preview</h3>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50">
                      {productForm.image ? (
                        <div className="space-y-4">
                          <img 
                            src={productForm.image} 
                            alt="Product preview"
                            className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200/gray/white?text=Invalid+Image+URL';
                              e.target.className = 'w-full h-64 object-cover rounded-lg border-2 border-red-200 shadow-md opacity-60';
                            }}
                            onLoad={(e) => {
                              e.target.className = 'w-full h-64 object-cover rounded-lg border-2 border-green-200 shadow-md';
                            }}
                          />
                          <div className="text-center">
                            <p className="text-sm text-green-600 font-medium">✓ Image loaded successfully</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                            <svg fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 7v10h16V7H4zm8 2l4 5H8l4-5z"/>
                            </svg>
                          </div>
                          <p className="text-gray-500 text-sm">Enter an image URL to see preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Submit Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-300 disabled:to-amber-300 text-white px-8 py-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-lg"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
                  className="flex-1 sm:flex-none bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-300 disabled:to-gray-300 text-white px-8 py-4 rounded-xl shadow-lg transition-all duration-200 font-semibold text-lg"
                >
                  Cancel
                </button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ProductAdd;