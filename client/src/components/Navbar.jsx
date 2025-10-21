// Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CartIcon from "./CartIcon";
import { 
  FaPaw,  
  FaSignInAlt, 
  FaUserPlus, 
  FaSignOutAlt, 
  FaInfoCircle, 
  FaCut, 
  FaConciergeBell,
  FaShoppingBag 
} from "react-icons/fa";

function Navbar() {
  const { user, logout } = useAuth();
  
  // Force re-render when user changes
  console.log("Navbar - User avatar:", user?.avatarUrl);

  const menuVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <nav
      className="flex justify-between items-center p-4 bg-yellow-500 text-white shadow-lg sticky top-0 z-50"
      
      
      
    >
     
      <div
        className="flex items-center font-bold text-2xl gap-2"
        
        
      >
        <FaPaw /> <Link to="/home">PetIQ</Link>
      </div>

   
      <div
        className="flex gap-6 items-center"
        
        initial="hidden"
        animate="visible"
      >

        <div
          className="flex items-center gap-1"
          
          
          
        >
          <FaPaw />
          <Link to="/home">Home</Link>
        </div>

        <div
          className="flex items-center gap-1"
          
          
          
        >
          <FaShoppingBag />
          <Link to="/products">Pet Products</Link>
        </div>

        <div
          className="flex items-center gap-1"
          
          
          
        >
          <FaCut />
          <Link to="/services">Services</Link>
        </div>

        <div
          className="flex items-center gap-1"
          
          
          
        >
          <FaInfoCircle />
          <Link to="/about">About Us</Link>
        </div>

        {/* Cart Icon */}
        <div >
          <CartIcon />
        </div>

       
        {user ? (
          <>
    
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 cursor-pointer"
              
              
              
            >
              <img
                key={user.avatarUrl || 'default'}
                src={
                  user.avatarUrl 
                    ? user.avatarUrl.startsWith("http") 
                      ? user.avatarUrl 
                      : `http://localhost:5000${user.avatarUrl}`
                    : "/assets/default-avatar.png"
                }
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover shadow-md"
                onError={(e) => {
                  console.log("Image load error for:", e.target.src);
                  e.target.src = "/assets/default-avatar.png";
                }}
              />
              <Link to="/profile" className="font-semibold">
                {user.name}
              </Link>
            </div>

          
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600"
              
              
              
            >
              <FaSignOutAlt />
              Logout
            </button>
          </>
        ) : (
          <>
            <div
              className="flex items-center gap-2"
              
              
              
            >
              <FaSignInAlt />
              <Link to="/login">Sign In</Link>
            </div>
            
            <div
              className="flex items-center gap-2"
              
              
              
            >
              <FaSignInAlt />
              <Link to="/adminlogin">Admin Login</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
