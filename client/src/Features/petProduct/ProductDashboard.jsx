import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen, FaPlus, FaDollarSign, FaWarehouse } from "react-icons/fa";
import { productBaseURL } from "../../axiosinstance";

function ProductDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductData();
  }, []);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const { data } = await productBaseURL.get("/");
      
      if (data?.success && data?.data) {
        const products = data.data;
        
        // Calculate statistics
        const totalProducts = products.length;
        const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
        const lowStockItems = products.filter(product => product.stock > 0 && product.stock <= 10).length;
        const outOfStockItems = products.filter(product => product.stock === 0).length;
        
        setStats({
          totalProducts,
          totalValue,
          lowStockItems,
          outOfStockItems
        });

        // Get 5 most recent products
        const recent = products
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentProducts(recent);
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: <FaBoxOpen className="text-2xl" />,
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Total Inventory Value",
      value: `Rs. ${stats.totalValue.toLocaleString()}`,
      icon: <FaDollarSign className="text-2xl" />,
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: <FaWarehouse className="text-2xl" />,
      color: "bg-yellow-500",
      textColor: "text-yellow-600"
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockItems,
      icon: <FaWarehouse className="text-2xl" />,
      color: "bg-red-500",
      textColor: "text-red-600"
    }
  ];

  if (loading) {
    return (
      <div className="w-full px-5 py-6 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full px-5 py-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.h2
          className="text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          Product Management Dashboard
        </motion.h2>
        <motion.button
          onClick={() => navigate("/admin/products/add")}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaPlus />
          Add New Product
        </motion.button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-lg shadow-md p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className={`text-2xl font-semibold ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} text-white p-3 rounded-full`}>
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.button
          onClick={() => navigate("/admin/products/list")}
          className="bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 p-4 rounded-lg shadow transition-colors duration-200 text-left"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-semibold text-lg mb-2">View All Products</h3>
          <p className="text-sm text-gray-600">Browse, edit, and manage all products in your inventory</p>
        </motion.button>

        <motion.button
          onClick={() => navigate("/admin/products/add")}
          className="bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 p-4 rounded-lg shadow transition-colors duration-200 text-left"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="font-semibold text-lg mb-2">Add New Product</h3>
          <p className="text-sm text-gray-600">Add new products to your inventory with details</p>
        </motion.button>

        <motion.button
          className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 p-4 rounded-lg shadow transition-colors duration-200 text-left opacity-75 cursor-not-allowed"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0.75, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="font-semibold text-lg mb-2">Analytics (Coming Soon)</h3>
          <p className="text-sm text-gray-600">View detailed analytics and reports for your products</p>
        </motion.button>
      </div>

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <motion.div
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recently Added Products</h3>
            <button
              onClick={() => navigate("/admin/products/list")}
              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          
          <div className="space-y-3">
            {recentProducts.map((product, index) => (
              <motion.div
                key={product._id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + (index * 0.1) }}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="h-10 w-10 object-cover rounded border"
                    onLoad={() => console.log('Dashboard image loaded:', product.image)}
                    onError={(e) => {
                      console.error('Dashboard image failed to load:', product.image);
                      e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">Stock: {product.stock} units</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">Rs. {product.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default ProductDashboard;