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
import { useSidebar } from "../context/SidebarContext";

// Sidebar links configuration
const links = [
  { name: "Dashboard", icon: <FaHome />, path: "/admin/dashboard" },
  { name: "Employees", icon: <FaUsers />, path: "/admin/userlist" },
  { name: "Appointments", icon: <FaCalendarAlt />, path: "/admin/appointments" },
  { name: "Medical Records", icon: <FaFileMedical />, path: "/admin/medical-records" },
  { name: "Pet Products", icon: <FaBoxOpen />, path: "/admin/products" },
  { name: "Payments", icon: <FaDollarSign />, path: "/admin/payments" },
];

const Sidebar = () => {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <div className="flex">
   
      <motion.div
        animate={{ width: isOpen ? 250 : 60 }}
        className="bg-amber-500 h-screen p-5 text-white fixed left-0 top-0 duration-300 z-40 overflow-y-auto"
      >
   
        <button
          className="absolute top-4 right-[-12px] bg-amber-700 w-7 h-7 flex items-center justify-center rounded-full"
          onClick={toggleSidebar}
        >
          {isOpen ? <FaAngleLeft /> : <FaAngleRight />}
        </button>

   
        <div className={`text-2xl font-bold mb-8 ${!isOpen && "text-center"}`}>
          {isOpen ? "PetIQ" : "PQ"}
        </div>

 
        <ul className="space-y-3 mt-12">
          {links.map((link, index) => (
            <NavLink
              key={index}
              to={link.path}
              className="flex items-center gap-4 p-3 rounded-md hover:bg-blue-500 transition-colors"
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
