import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaHome,
  FaUsers,
  FaPaw,
  FaCalendarAlt,
  FaSignOutAlt,
  FaFileMedical,
  FaDollarSign,
  FaBoxOpen,
  FaAngleLeft,
  FaAngleRight,
  FaUserPlus,
  FaUser,
  FaCreditCard,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { name: "Dashboard", icon: <FaHome />, path: "/admin/dashboard" },
  { name: "Profile", icon: <FaUser />, path: "/admin/profile" },
  { name: "Employees", icon: <FaUsers />, path: "/admin/userlist" },
  { name: "Pet Owners", icon: <FaUserPlus />, path: "/admin/registered-users" },
  { name: "Appointment", icon: <FaCalendarAlt />, path: "/admin/appointments" },
  { name: "Medical Records", icon: <FaFileMedical />, path: "/admin/medical-records" },
  { name: "Payments", icon: <FaDollarSign />, path: "/admin/payments" },
  { name: "Products", icon: <FaBoxOpen />, path: "/admin/products" },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/adminlogin";
  };

  return (
    <div className="flex">
   
      <motion.div
        animate={{ width: isOpen ? 250 : 60 }}
        className="bg-amber-500 h-screen p-5 text-white relative duration-300 flex flex-col"
      >
   
        <button
          className="absolute top-4 right-[-12px] bg-amber-700 w-7 h-7 flex items-center justify-center rounded-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FaAngleLeft /> : <FaAngleRight />}
        </button>

   
        <div className={`text-2xl font-bold mb-8 ${!isOpen && "text-center"}`}>
          {isOpen ? "PetCare" : "PC"}
        </div>

        {/* User Profile Section */}
        {user && (
          <div className={`mb-6 p-3 bg-amber-600 rounded-lg ${!isOpen && "flex justify-center"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <img 
                    src={`http://localhost:3000${user.avatarUrl}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUser className="text-amber-600 text-lg" />
                )}
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-amber-200 capitalize">{user.role}</p>
                </div>
              )}
            </div>
          </div>
        )}

 
        <ul className="flex-1">
          {links.map((link, index) => (
            <NavLink
              key={index}
              to={link.path}
              className="flex items-center gap-4 p-2 rounded-md hover:bg-blue-500 my-2 transition-colors"
            >
              <span className="text-xl">{link.icon}</span>
              {isOpen && <span>{link.name}</span>}
            </NavLink>
          ))}
        </ul>

        {/* Logout Button */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 p-2 rounded-md hover:bg-red-500 w-full transition-colors"
          >
            <span className="text-xl"><FaSignOutAlt /></span>
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.div>


    </div>
  );
};

export default Sidebar;
