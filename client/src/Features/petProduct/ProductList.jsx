import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { productBaseURL } from "../../axiosinstance.js";
import { MdDelete } from "react-icons/md";
import { FaPen, FaSearch, FaBoxOpen, FaPlus, FaTachometerAlt, FaDownload, FaBell, FaExclamationTriangle } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function ProductList() {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const navigate = useNavigate();

  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await productBaseURL.get("/");
      if (data?.success) {
        setProductList(data?.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
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

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
      const { data } = await productBaseURL.delete(`/${id}`);
      if (data?.success) {
        alert(data?.message || "Product deleted successfully");
        getAllProducts(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  const handleUpdate = (product) => {
    // Navigate to the add/update form with the selected product as state
    navigate(`/admin/products/add`, { state: product });
  };

  const handleDownloadPDF = () => {
    try {
      console.log('PDF download started');
      
      // Check if products are still loading
      if (loading) {
        alert('Please wait for products to finish loading...');
        return;
      }
      
      // Check if products are available
      if (!filteredProducts || filteredProducts.length === 0) {
        alert('No products available to download');
        return;
      }

      // Create new PDF document
      const doc = new jsPDF();
      
      // Colors
      const primaryColor = [245, 158, 11]; // Amber-500
      const secondaryColor = [251, 191, 36]; // Amber-400
      const darkGray = [55, 65, 81]; // Gray-700
      const lightGray = [243, 244, 246]; // Gray-100
      const textDark = [31, 41, 55]; // Gray-800
      
      // Add header background
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 45, 'F');
      
      // Add company logo/name
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text('PetIQ', 20, 20);
      
      // Add document title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Product Inventory Report', 20, 32);
      
      // Add generation info
      const now = new Date();
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${now.toLocaleDateString('en-GB')} at ${now.toLocaleTimeString('en-GB')}`, 20, 39);
      
      // Calculate statistics
      const totalProducts = filteredProducts.length;
      const totalStock = filteredProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
      const totalValue = filteredProducts.reduce((sum, p) => sum + (p.price * p.stock || 0), 0);
      const outOfStock = filteredProducts.filter(p => p.stock === 0).length;
      const lowStock = filteredProducts.filter(p => p.stock > 0 && p.stock <= 10).length;
      
      // Add statistics boxes
      const boxY = 50;
      const boxHeight = 20;
      const boxWidth = 40;
      
      // Box 1: Total Products
      doc.setFillColor(...lightGray);
      doc.rect(20, boxY, boxWidth, boxHeight, 'F');
      doc.setTextColor(...textDark);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text('Total Products', 22, boxY + 6);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(totalProducts.toString(), 22, boxY + 15);
      
      // Box 2: Total Stock
      doc.setFillColor(...lightGray);
      doc.rect(65, boxY, boxWidth, boxHeight, 'F');
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text('Total Stock', 67, boxY + 6);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(totalStock.toString(), 67, boxY + 15);
      
      // Box 3: Total Value
      doc.setFillColor(...lightGray);
      doc.rect(110, boxY, boxWidth, boxHeight, 'F');
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text('Total Value', 112, boxY + 6);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Rs. ${(totalValue / 1000).toFixed(1)}K`, 112, boxY + 15);
      
      // Box 4: Alerts
      doc.setFillColor(254, 226, 226); // Red-100
      doc.rect(155, boxY, boxWidth, boxHeight, 'F');
      doc.setTextColor(220, 38, 38); // Red-600
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text('Stock Alerts', 157, boxY + 6);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${outOfStock + lowStock}`, 157, boxY + 15);
      
      // Prepare data for table
      doc.setTextColor(...textDark);
      const tableData = filteredProducts.map((product, index) => {
        const stockStatus = product.stock === 0 ? 'OUT' : product.stock <= 10 ? 'LOW' : 'OK';
        return [
          (index + 1).toString(),
          product.name || 'N/A',
          product.category || 'Other',
          product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-GB') : 'N/A',
          `${product.stock || 0}`,
          stockStatus,
          `Rs. ${(product.price || 0).toLocaleString()}`
        ];
      });
      
      // Create table with enhanced styling
      autoTable(doc, {
        head: [['#', 'Product Name', 'Category', 'Date', 'Stock', 'Status', 'Price (Rs.)']],
        body: tableData,
        startY: 75,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 30, halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        didParseCell: function(data) {
          // Color code stock status
          if (data.column.index === 5 && data.section === 'body') {
            const status = data.cell.text[0];
            if (status === 'OUT') {
              data.cell.styles.textColor = [220, 38, 38]; // Red
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'LOW') {
              data.cell.styles.textColor = [217, 119, 6]; // Amber
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [22, 163, 74]; // Green
            }
          }
        }
      });
      
      // Add footer
      const finalY = doc.lastAutoTable.finalY + 10;
      const pageHeight = doc.internal.pageSize.height;
      
      // Summary section
      doc.setFillColor(...secondaryColor);
      doc.rect(20, finalY, 170, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text('Inventory Summary', 25, finalY + 7);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Products: ${totalProducts}`, 25, finalY + 13);
      doc.text(`In Stock: ${totalProducts - outOfStock}`, 25, finalY + 18);
      
      doc.text(`Out of Stock: ${outOfStock}`, 80, finalY + 13);
      doc.text(`Low Stock: ${lowStock}`, 80, finalY + 18);
      
      doc.text(`Total Inventory Value: Rs. ${totalValue.toLocaleString()}`, 135, finalY + 15.5);
      
      // Page footer
      doc.setFillColor(...darkGray);
      doc.rect(0, pageHeight - 15, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text('PetIQ - Pet Product Management System', 20, pageHeight - 7);
      doc.text(`Page 1 of 1`, 170, pageHeight - 7);
      
      // Save PDF with formatted filename
      const fileName = `PetIQ_Products_${now.toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      console.log('PDF saved successfully:', fileName);
      
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Error creating PDF: ' + error.message);
    }
  };

  // Filter products based on search query
  const filteredProducts = productList?.filter((product) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const fieldsToSearch = [
      product?.name,
      product?.description,
      product?.category,
      String(product?.price),
      String(product?.stock),
    ];
    return fieldsToSearch.some((value) => String(value || "").toLowerCase().includes(query));
  });

  // Calculate stock notifications
  const stockNotifications = productList?.reduce((notifications, product) => {
    if (product.stock === 0) {
      notifications.outOfStock.push(product);
    } else if (product.stock <= 10) {
      notifications.lowStock.push(product);
    }
    return notifications;
  }, { outOfStock: [], lowStock: [] }) || { outOfStock: [], lowStock: [] };

  const totalNotifications = stockNotifications.outOfStock.length + stockNotifications.lowStock.length;

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
          <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 px-5 py-6 h-screen flex flex-col"
      
      
      
    >
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-bold text-gray-800 mb-2"
          
          
          
        >
          All Products
        </h2>
        <p
          className="text-gray-600"
          
          
          
        >
          Browse and manage your product inventory
        </p>
      </div>

      {/* Search Bar and Action Buttons */}
      <div 
        className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
        
        
        
      >
        {/* Search Bar */}
        <div className="w-full md:flex-1 md:max-w-lg">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
              <FaSearch size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products (name, category, price, stock...)"
              aria-label="Search products"
              className="w-full pl-11 pr-10 py-3 rounded-xl border-2 border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                aria-label="Clear search"
              >
                <IoClose size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Found <span className="font-semibold text-amber-600">{filteredProducts?.length}</span> product(s)
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Notification Bell */}
          <motion.div className="relative notification-container">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`flex-1 md:flex-none px-4 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold relative ${
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
            
            {/* Notification Dropdown */}
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
            onClick={handleDownloadPDF}
            className="flex-1 md:flex-none bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            
            
          >
            <FaDownload className="text-lg" />
            Download PDF
          </button>
          <button
            onClick={() => navigate("/admin/products")}
            className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            
            
          >
            <FaTachometerAlt className="text-lg" />
            Dashboard
          </button>
          <button
            onClick={() => navigate("/admin/products/add")}
            className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            
            
          >
            <FaPlus className="text-lg" />
            Add Product
          </button>
        </div>
      </div>

      <div 
        className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 flex-1 flex flex-col" 
         
         
        
      >
        <div className="overflow-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-amber-50 to-amber-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Image</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Price (Rs.)</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody
              className="bg-white divide-y divide-gray-200"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 1 },
                show: { opacity: 1, transition: { staggerChildren: 0.05 } },
              }}
            >
              {filteredProducts?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaBoxOpen className="text-gray-300 text-6xl mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        {searchQuery ? "No products match your search" : "No products found"}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {searchQuery ? "Try a different search term" : "Click 'Add New Product' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts?.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-amber-50/50 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="h-16 w-16 object-cover rounded-lg border-2 border-gray-200 group-hover:border-amber-400 shadow-sm transition-all duration-200"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs">
                        <p className="line-clamp-1">{product.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                          product.stock > 10 
                            ? 'bg-green-100 text-green-700' 
                            : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.stock} {product.stock === 1 ? 'unit' : 'units'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xs text-green-600 mr-1">Rs.</span>
                        <span className="text-lg font-bold text-green-600">
                          {product.price?.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdate(product)}
                          className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                          title="Edit Product"
                        >
                          <FaPen size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                          title="Delete Product"
                        >
                          <MdDelete size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stats */}
      {filteredProducts?.length > 0 && (
        <div 
          className="mt-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
          
          
          
        >
          <div className="text-center">
            <span className="text-sm text-gray-500">Total Products: </span>
            <span className="text-lg font-bold text-gray-800">{productList?.length || 0}</span>
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

export default ProductList;