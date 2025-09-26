import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { productBaseURL } from "../../axiosinstance";
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function ProductList() {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="w-full px-5 py-6 flex justify-center">
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
      <div className="flex items-center justify-between mb-4">
        <motion.h2
          className="text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          Pet Products Management
        </motion.h2>
        <motion.button
          onClick={() => navigate("/admin/products/add")}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md shadow transition-colors duration-200"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Add New Product
        </motion.button>
      </div>

      <motion.div 
        className="bg-white shadow rounded-lg overflow-hidden" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.15 }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Product Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Price (Rs.)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created Date</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
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
              {productList?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No products found. Click "Add New Product" to get started.
                  </td>
                </tr>
              ) : (
                productList?.map((product, index) => (
                  <motion.tr
                    key={product._id}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="h-12 w-12 object-cover rounded-md border"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/48?text=No+Image';
                        }}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {product.description}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        Rs. {product.price?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          onClick={() => handleUpdate(product)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="Edit Product"
                        >
                          <FaPen size={14} />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="Delete Product"
                        >
                          <MdDelete size={16} />
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

      {productList?.length > 0 && (
        <motion.div 
          className="mt-4 text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Total Products: <span className="font-semibold">{productList.length}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default ProductList;