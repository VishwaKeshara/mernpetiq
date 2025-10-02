import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { productBaseURL } from "../../axiosinstance";
import { MdDelete } from "react-icons/md";
import { FaPen, FaSearch, FaBoxOpen, FaPlus, FaTachometerAlt, FaDownload } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function ProductList() {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
      
      // Add title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Available Products Report', 20, 20);
      
      // Add generation date
      const now = new Date();
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 20, 30);
      
      // Prepare data for table
      const tableData = filteredProducts.map((product, index) => [
        (index + 1).toString(),
        product.name || 'N/A',
        product.category || 'Other',
        product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-GB') : 'N/A',
        product.stock === 0 ? 'Out of Stock' : `${product.stock} units`,
        `Rs. ${(product.price || 0).toLocaleString()}`
      ]);
      
      // Create table
      autoTable(doc, {
        head: [['#', 'Product Name', 'Category', 'Created Date', 'Stock', 'Price (Rs.)']],
        body: tableData,
        startY: 40,
        headStyles: {
          fillColor: [255, 165, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });
      
      // Add summary
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text(`Total Products: ${filteredProducts.length}`, 20, finalY);
      
      // Save PDF
      doc.save('products_report.pdf');
      console.log('PDF saved successfully');
      
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
    <motion.div
      className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 px-5 py-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-8">
        <motion.h2
          className="text-3xl font-bold text-gray-800 mb-2"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          All Products
        </motion.h2>
        <motion.p
          className="text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Browse and manage your product inventory
        </motion.p>
      </div>

      {/* Search Bar and Action Buttons */}
      <motion.div 
        className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
          <motion.button
            onClick={handleDownloadPDF}
            className="flex-1 md:flex-none bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaDownload className="text-lg" />
            Download PDF
          </motion.button>
          <motion.button
            onClick={() => navigate("/admin/products/add")}
            className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaPlus className="text-lg" />
            Add Product
          </motion.button>
          <motion.button
            onClick={() => navigate("/admin/products")}
            className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaTachometerAlt className="text-lg" />
            Dashboard
          </motion.button>
        </div>
      </motion.div>

      <motion.div 
        className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.4 }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-amber-50 to-amber-100">
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
            <motion.tbody
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
                filteredProducts?.map((product, index) => (
                  <motion.tr
                    key={product._id}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
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
                        <motion.button
                          onClick={() => handleUpdate(product)}
                          className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Edit Product"
                        >
                          <FaPen size={12} />
                          Edit
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(product._id)}
                          className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Delete Product"
                        >
                          <MdDelete size={14} />
                          Delete
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      {/* Footer Stats */}
      {filteredProducts?.length > 0 && (
        <motion.div 
          className="mt-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center">
            <span className="text-sm text-gray-500">Total Products: </span>
            <span className="text-lg font-bold text-gray-800">{productList?.length || 0}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default ProductList;