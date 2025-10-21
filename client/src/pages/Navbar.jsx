// Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FaPaw, 
  FaUser, 
  FaSignInAlt, 
  FaUserPlus, 
  FaSignOutAlt, 
  FaInfoCircle, 
  FaCut, 
  FaConciergeBell,
  FaCreditCard
} from "react-icons/fa";

function Navbar() {
  const { user, logout } = useAuth();

  // Function to get proper avatar source
  const getAvatarSrc = (avatarUrl) => {
    if (!avatarUrl || avatarUrl.trim() === "" || avatarUrl === "null" || avatarUrl === "undefined") {
      return null; // Return null to use default styling instead of external placeholder
    }
    
    // If avatarUrl doesn't start with http, prepend the server URL
    return avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`;
  };


  return (
    <nav
      className="flex justify-between items-center p-4 bg-yellow-500 text-white shadow-lg sticky top-0 z-50"
      
      
      
    >
     
      <div
        className="flex items-center font-bold text-2xl gap-2"
        
        
      >
        <FaPaw /> <Link to="/home">PetIQ.lk</Link>
      </div>

   
      <div className="flex gap-6 items-center">

        <div
          className="flex items-center gap-1"
          
          
          
        >
          <FaPaw />
          <Link to="/">Home</Link>
        </div>

        <div
          className="flex items-center gap-1"
          
          
          
        >
          <FaInfoCircle />
          <Link to="/about">About</Link>
        </div>

        <div
          className="flex items-center gap-1"
          
          
          
        >
          <FaCut />
          <Link to="/grooming">Grooming</Link>
        </div>

        <div
          className="flex items-center gap-1"
          
          
          
        >
          <FaConciergeBell />
          <Link to="/services">Services</Link>
        </div>

       
        {user ? (
          <>
        
    
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 cursor-pointer"
              
              
              
            >
              {getAvatarSrc(user.avatarUrl) ? (
                <img
                  src={getAvatarSrc(user.avatarUrl)}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-md ${getAvatarSrc(user.avatarUrl) ? 'hidden' : 'flex'}`}
              >
                <FaUser className="text-yellow-800 text-sm" />
              </div>
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
              <Link to="/login">Login</Link>
            </div>

            <div
              className="flex items-center gap-2"
              
              
              
            >
              <FaUserPlus />
              <Link to="/signup">Register</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
