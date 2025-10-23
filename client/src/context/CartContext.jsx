import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productBaseURL } from '../axiosinstance';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('petiq_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('petiq_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    const existingItem = cartItems.find(item => item._id === product._id);
    
    if (existingItem) {
      // Update quantity if item already exists
      const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
      if (newQuantity > existingItem.quantity) {
        setCartItems(prevItems =>
          prevItems.map(item =>
            item._id === product._id
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
        toast.success(`Updated ${product.name} quantity in cart!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.warning(`Cannot add more ${product.name} - stock limit reached!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } else {
      // Add new item
      if (product.stock > 0) {
        setCartItems(prevItems => [...prevItems, { ...product, quantity: Math.min(quantity, product.stock) }]);
        toast.success(`${product.name} added to cart!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.error(`${product.name} is out of stock!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    }
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item._id === productId) {
          return { ...item, quantity: Math.min(newQuantity, item.stock) };
        }
        return item;
      })
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get cart totals
  const getCartTotals = () => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      totalItems,
      totalPrice,
      itemCount: cartItems.length
    };
  };

  // Check if item is in cart
  const isInCart = (productId) => {
    return cartItems.some(item => item._id === productId);
  };

  // Get item quantity in cart
  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    return item ? item.quantity : 0;
  };

  // Toggle cart sidebar
  const toggleCart = () => {
    setIsCartOpen(prev => !prev);
  };

  // Process purchase and update stock levels
  const processPurchase = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty!');
      return false;
    }

    try {
      // Update stock for each item in cart
      const stockUpdatePromises = cartItems.map(async (item) => {
        try {
          const response = await productBaseURL.patch(`/${item._id}/stock`, {
            quantity: item.quantity
          });
          
          if (!response.data.success) {
            throw new Error(`Failed to update stock for ${item.name}`);
          }
          
          return {
            success: true,
            productName: item.name,
            newStock: response.data.data.stock
          };
        } catch (error) {
          return {
            success: false,
            productName: item.name,
            error: error.response?.data?.message || error.message
          };
        }
      });

      const results = await Promise.all(stockUpdatePromises);
      
      // Check if all stock updates were successful
      const failedUpdates = results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        // Some stock updates failed
        const errorMessages = failedUpdates.map(result => 
          `${result.productName}: ${result.error}`
        ).join(', ');
        
        toast.error(`Stock update failed for: ${errorMessages}`);
        return false;
      }

      // All stock updates successful
      const updatedProducts = results.length;
      
      toast.success(`Purchase successful! Stock updated for ${updatedProducts} product${updatedProducts > 1 ? 's' : ''}.`);
      
      // Note: Cart will be cleared by the payment handler, not here
      // This allows for proper order completion flow
      
      return true;
      
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase. Please try again.');
      return false;
    }
  };

  const value = {
    cartItems,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotals,
    isInCart,
    getItemQuantity,
    toggleCart,
    setIsCartOpen,
    processPurchase
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;