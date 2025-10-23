import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaBoxOpen, FaPlus, FaDollarSign, FaWarehouse, FaBell, FaExclamationTriangle } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa";
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
  const [allProducts, setAllProducts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    fetchProductData();
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Handle notification item click
  const handleNotificationClick = (product) => {
    setSelectedProduct(product);
    setShowActionModal(true);
    setShowNotifications(false);
  };

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const { data } = await productBaseURL.get("/");
      
      if (data?.success && data?.data) {
        const products = data.data;
        
        // Store all products for notifications
        setAllProducts(products);
        
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

  // Calculate stock notifications
  const stockNotifications = allProducts?.reduce((notifications, product) => {
    if (product.stock === 0) {
      notifications.outOfStock.push(product);
    } else if (product.stock <= 10) {
      notifications.lowStock.push(product);
    }
    return notifications;
  }, { outOfStock: [], lowStock: [] }) || { outOfStock: [], lowStock: [] };

  const totalNotifications = stockNotifications.outOfStock.length + stockNotifications.lowStock.length;

  // Handle delete product
  const handleDelete = async (id) => {
    try {
      const { data } = await productBaseURL.delete(`/${id}`);
      if (data?.success) {
        alert(data?.message || "Product deleted successfully");
        fetchProductData(); // Refresh the data
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
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
    <div
      className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 px-5 py-6 flex flex-col justify-center"
      
      
      
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2
            className="text-3xl font-bold text-gray-800 mb-2"
            
            
            
          >
            Product Management
          </h2>
          <p
            className="text-gray-600"
            
            
            
          >
            Monitor and manage your product inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <motion.div className="relative notification-container">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`px-4 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold relative ${
                totalNotifications > 0 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                  : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white'
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaBell className="text-lg" />
              {totalNotifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-800 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                  {totalNotifications}
                </span>
              )}
            </motion.button>
            
            {/* Notification Dropdown - Same as ProductList */}
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-122 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-y-auto"
              >
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FaBell className="text-red-500" />
                    Stock Notifications
                  </h3>
                </div>
                
                <div className="p-4">
                  {totalNotifications === 0 ? (
                    <div className="text-center py-8">
                      <FaBell className="mx-auto text-4xl text-gray-300 mb-3" />
                      <p className="text-gray-500">No stock alerts at the moment</p>
                      <p className="text-sm text-gray-400">All products are well stocked!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Out of Stock Items */}
                      {stockNotifications.outOfStock.length > 0 && (
                        <div>
                          <h4 className="text-red-600 font-semibold mb-2 flex items-center gap-2">
                            <FaExclamationTriangle />
                            Out of Stock ({stockNotifications.outOfStock.length})
                          </h4>
                          <div className="space-y-2">
                            {stockNotifications.outOfStock.map((product) => (
                              <div 
                                key={product._id} 
                                className="bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors"
                                onClick={() => handleNotificationClick(product)}
                              >
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/40x40/FEF3C7/D97706?text=Pet';
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                                    <p className="text-xs text-red-600 font-semibold">Stock: {product.stock}</p>
                                    <p className="text-xs text-gray-500 mt-1">Click to manage this product</p>
                                  </div>
                                  <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                                    URGENT
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Low Stock Items */}
                      {stockNotifications.lowStock.length > 0 && (
                        <div>
                          <h4 className="text-yellow-600 font-semibold mb-2 flex items-center gap-2">
                            <FaExclamationTriangle />
                            Low Stock ({stockNotifications.lowStock.length})
                          </h4>
                          <div className="space-y-2">
                            {stockNotifications.lowStock.map((product) => (
                              <div 
                                key={product._id} 
                                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 cursor-pointer hover:bg-yellow-100 transition-colors"
                                onClick={() => handleNotificationClick(product)}
                              >
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/40x40/FEF3C7/D97706?text=Pet';
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                                    <p className="text-xs text-yellow-600 font-semibold">Stock: {product.stock}</p>
                                    <p className="text-xs text-gray-500 mt-1">Click to manage this product</p>
                                  </div>
                                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
                                    LOW
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          <button
            onClick={() => navigate("/admin/products/list")}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
            
            
            
            
            
          >
            <FaBoxOpen className="text-lg" />
            View All Products
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="relative bg-white rounded-xl shadow-lg p-6 overflow-hidden group hover:shadow-xl transition-all duration-300"
            
            
            
            
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
          </div>
        ))}
      </div>

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <div
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          
          
          
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
              <div
                key={product._id}
                className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-amber-200 hover:bg-amber-50 transition-all duration-200 cursor-pointer group"
                
                
                
                
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative z-50"
          >
            <div className="text-center">
              <div className="mb-4">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-20 h-20 rounded-lg object-cover mx-auto border-2 border-gray-200"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80x80/FEF3C7/D97706?text=Pet';
                  }}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h3>
              <p className="text-gray-600 mb-4">
                {selectedProduct.stock === 0 
                  ? "This product is out of stock. What would you like to do?" 
                  : "This product has low stock. What would you like to do?"
                }
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedProduct.stock === 0 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  Stock: {selectedProduct.stock} units
                </span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigate(`/admin/products/add`, { state: selectedProduct });
                    setShowActionModal(false);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FaPen size={14} />
                  Update Stock
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this product?')) {
                      await handleDelete(selectedProduct._id);
                      setShowActionModal(false);
                    }
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <MdDelete size={16} />
                  Delete
                </button>
              </div>
              
              <button
                onClick={() => setShowActionModal(false)}
                className="mt-3 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default ProductDashboard;