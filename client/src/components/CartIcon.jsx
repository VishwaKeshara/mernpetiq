import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

function CartIcon() {
  const { toggleCart, getCartTotals } = useCart();
  const { totalItems } = getCartTotals();

  return (
    <button
      
      
      onClick={toggleCart}
      className="relative p-3 text-gray-700 hover:text-yellow-600 transition-colors duration-200"
    >
      <FaShoppingCart size={24} />
      
      {totalItems > 0 && (
        <span
          
          
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}

export default CartIcon;