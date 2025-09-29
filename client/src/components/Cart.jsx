import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus, FaMinus, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

function Cart() {
  const {
    cartItems,
    isCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotals,
    setIsCartOpen
  } = useCart();

  const navigate = useNavigate();
  const { totalItems, totalPrice } = getCartTotals();

  const handleCheckout = () => {
    // Navigate to checkout page or handle checkout logic
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleQuantityChange = (productId, change) => {
    const item = cartItems.find(item => item._id === productId);
    if (item) {
      const newQuantity = item.quantity + change;
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Cart Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Cart Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FaShoppingCart className="text-yellow-600" />
                Shopping Cart ({totalItems})
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <FaTimes size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FaShoppingCart size={64} className="mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm text-center mt-2">Add some products to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64x64/FEF3C7/D97706?text=Pet';
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{item.category}</p>
                        <p className="text-lg font-bold text-yellow-600">
                          Rs. {item.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors duration-200"
                          title="Remove item"
                        >
                          <FaTrash size={12} />
                        </button>

                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300">
                          <button
                            onClick={() => handleQuantityChange(item._id, -1)}
                            className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors duration-200"
                            disabled={item.quantity <= 1}
                          >
                            <FaMinus size={10} className={item.quantity <= 1 ? 'text-gray-300' : 'text-gray-600'} />
                          </button>
                          
                          <span className="px-3 py-2 font-semibold text-gray-900 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => handleQuantityChange(item._id, 1)}
                            className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors duration-200"
                            disabled={item.quantity >= item.stock}
                          >
                            <FaPlus size={10} className={item.quantity >= item.stock ? 'text-gray-300' : 'text-gray-600'} />
                          </button>
                        </div>

                        <p className="text-sm font-bold text-gray-900">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                {/* Total */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    Rs. {totalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200"
                  >
                    Proceed to Checkout
                  </motion.button>

                  <button
                    onClick={clearCart}
                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                  >
                    Clear Cart
                  </button>
                </div>

                {/* Continue Shopping */}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full mt-3 text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Cart;