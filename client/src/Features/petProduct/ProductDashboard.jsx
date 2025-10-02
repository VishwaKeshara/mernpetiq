import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen, FaPlus, FaDollarSign, FaWarehouse } from "react-icons/fa";
import { productBaseURL } from "../../axiosinstance.js";

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
      icon: <FaBoxOpen className="text-3xl" />,
      gradient: "from-blue-400 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Total Inventory Value",
      value: `Rs. ${stats.totalValue.toLocaleString()}`,
      icon: <FaDollarSign className="text-3xl" />,
      gradient: "from-green-400 to-green-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: <FaWarehouse className="text-3xl" />,
      gradient: "from-yellow-400 to-yellow-600",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600"
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockItems,
      icon: <FaWarehouse className="text-3xl" />,
      gradient: "from-red-400 to-red-600",
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    }
  ];

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-amber-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FaBoxOpen className="text-amber-500 text-xl" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 px-5 py-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.h2
            className="text-3xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Product Management
          </motion.h2>
          <motion.p
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Monitor and manage your product inventory
          </motion.p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate("/admin/products/add")}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FaPlus className="text-lg" />
            Add New Product
          </motion.button>
          <motion.button
            onClick={() => navigate("/admin/products/list")}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FaBoxOpen className="text-lg" />
            View All Products
          </motion.button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            className="relative bg-white rounded-xl shadow-lg p-6 overflow-hidden group hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            {/* Gradient Background Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-2 font-medium">{card.title}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                  {card.value}
                </p>
              </div>
              <div className={`${card.iconBg} ${card.iconColor} p-4 rounded-2xl shadow-md transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300`}>
                {card.icon}
              </div>
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
          </motion.div>
        ))}
      </div>

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Recently Added Products</h3>
              <p className="text-sm text-gray-500 mt-1">Latest additions to your inventory</p>
            </div>
            <button
              onClick={() => navigate("/admin/products/list")}
              className="text-amber-600 hover:text-amber-700 text-sm font-semibold flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors duration-200"
            >
              View All
              <span className="text-lg">→</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {recentProducts.map((product, index) => (
              <motion.div
                key={product._id}
                className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-amber-200 hover:bg-amber-50 transition-all duration-200 cursor-pointer group"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + (index * 0.1) }}
                whileHover={{ x: 4 }}
                onClick={() => navigate("/admin/products/list")}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="h-14 w-14 object-cover rounded-lg border-2 border-gray-200 group-hover:border-amber-400 transition-colors duration-200"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/56?text=No+Image';
                      }}
                    />
                    {product.stock <= 10 && product.stock > 0 && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        !
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        0
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors duration-200">{product.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className={`text-sm font-medium ${
                        product.stock === 0 ? 'text-red-600' : 
                        product.stock <= 10 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        Stock: {product.stock} units
                      </p>
                      <span className="text-gray-300">•</span>
                      <p className="text-sm text-gray-500">
                        {product.category || 'Other'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">Rs. {product.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(product.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
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