import React from 'react';
import { motion } from 'framer-motion';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

function CartIcon() {
  const { toggleCart, getCartTotals } = useCart();
  const { totalItems } = getCartTotals();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleCart}
      className="relative p-3 text-gray-700 hover:text-yellow-600 transition-colors duration-200"
    >
      <FaShoppingCart size={24} />
      
      {totalItems > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
        >
          {totalItems > 99 ? '99+' : totalItems}
        </motion.span>
      )}
    </motion.button>
  );
}

export default CartIcon;