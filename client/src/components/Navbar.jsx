// Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
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

  const menuVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.nav
      className="flex justify-between items-center p-4 bg-yellow-500 text-white shadow-lg sticky top-0 z-50"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
     
      <motion.div
        className="flex items-center font-bold text-2xl gap-2"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaPaw /> <Link to="/home">PetIQ.LK</Link>
      </motion.div>

   
      <motion.div
        className="flex gap-6 items-center"
        variants={menuVariants}
        initial="hidden"
        animate="visible"
      >

        <motion.div
          className="flex items-center gap-1"
          variants={itemVariants}
          whileHover={{ scale: 1.05, color: "#FFD700" }}
          whileTap={{ scale: 0.95 }}
        >
          <FaPaw />
          <Link to="/home">Home</Link>
        </motion.div>

        <motion.div
          className="flex items-center gap-1"
          variants={itemVariants}
          whileHover={{ scale: 1.05, color: "#FFD700" }}
          whileTap={{ scale: 0.95 }}
        >
          <FaInfoCircle />
          <Link to="/about">About</Link>
        </motion.div>

        <motion.div
          className="flex items-center gap-1"
          variants={itemVariants}
          whileHover={{ scale: 1.05, color: "#FFD700" }}
          whileTap={{ scale: 0.95 }}
        >
          <FaShoppingBag />
          <Link to="/products">Pet Products</Link>
        </motion.div>

        <motion.div
          className="flex items-center gap-1"
          variants={itemVariants}
          whileHover={{ scale: 1.05, color: "#FFD700" }}
          whileTap={{ scale: 0.95 }}
        >
          <FaCut />
          <Link to="/services">Services</Link>
        </motion.div>

       
        {user ? (
          <>
    
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 cursor-pointer"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={user.avatarUrl || "/assets/default-avatar.png"}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover shadow-md"
              />
              <Link to="/profile" className="font-semibold">
                {user.name}
              </Link>
            </motion.div>

          
            <motion.button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaSignOutAlt />
              Logout
            </motion.button>
          </>
        ) : (
          <>
            <motion.div
              className="flex items-center gap-2"
              variants={itemVariants}
              whileHover={{ scale: 1.1, color: "#FFD700" }}
              whileTap={{ scale: 0.95 }}
            >
              <FaSignInAlt />
              <Link to="/login">Login</Link>
            </motion.div>

            <motion.div
              className="flex items-center gap-2"
              variants={itemVariants}
              whileHover={{ scale: 1.1, color: "#FFD700" }}
              whileTap={{ scale: 0.95 }}
            >
              <FaUserPlus />
              <Link to="/signup">Register</Link>
            </motion.div>
          </>
        )}
      </motion.div>
    </motion.nav>
  );
}

export default Navbar;
