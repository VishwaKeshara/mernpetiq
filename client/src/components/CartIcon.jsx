import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

function CartIcon() {
  const { toggleCart, getCartTotals } = useCart();
  const { totalItems } = getCartTotals();

  // Override display count when PaymentPage signals cart cleared (Mart success)
  const [overrideCount, setOverrideCount] = useState(null);

  useEffect(() => {
    const onCartChanged = (e) => {
      const next = typeof e?.detail?.count === 'number' ? e.detail.count : 0;
      setOverrideCount(next);
    };

    const onStorage = (e) => {
      if (
        e.key === 'cart:version' ||
        e.key === 'cart' ||
        e.key === 'cartItems' ||
        e.key === 'cart_count' ||
        e.key === 'cartCount'
      ) {
        setOverrideCount(0);
      }
    };

    window.addEventListener('cart:changed', onCartChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('cart:changed', onCartChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // When CartContext reaches 0, release override so future adds show correctly
  useEffect(() => {
    if (overrideCount !== null && totalItems === 0) {
      setOverrideCount(null);
    }
  }, [totalItems, overrideCount]);

  const displayCount = overrideCount ?? totalItems;

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleCart}
      className="relative p-3 text-gray-700 hover:text-yellow-600 transition-colors duration-200"
    >
      <FaShoppingCart size={24} />
      
      {displayCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
        >
          {displayCount > 99 ? '99+' : displayCount}
        </motion.span>
      )}
    </motion.button>
  );
}

export default CartIcon;