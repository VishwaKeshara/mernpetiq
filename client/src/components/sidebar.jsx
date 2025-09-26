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
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

// Sidebar links configuration
const links = [
  { name: "Dashboard", icon: <FaHome />, path: "/admin/Dashboard" },
  { name: "Employees", icon: <FaUsers />, path: "/admin/UserList" },
  { name: "Appointment", icon: <FaCalendarAlt />, path: "/admin/appointments" },
  { name: "Medical Records", icon: <FaFileMedical />, path: "/admin/medical-records" },
  { name: "Payments", icon: <FaDollarSign />, path: "/admin/payments" },
  { name: "Products", icon: <FaBoxOpen />, path: "/admin/products" },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex">
   
      <motion.div
        animate={{ width: isOpen ? 250 : 60 }}
        className="bg-amber-500 h-screen p-5 text-white relative duration-300"
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

 
        <ul>
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
      </motion.div>


    </div>
  );
};

export default Sidebar;
