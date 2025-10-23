import React from "react";
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
import { useSidebar } from "../context/SidebarContext";

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
  const { isOpen, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/adminlogin";
  };

  return (
    <div className="flex">
   
      <div
        className={`bg-amber-500 min-h-screen text-white fixed left-0 top-0 z-40 duration-300 flex flex-col shadow-lg ${
          isOpen ? "w-64 p-5" : "w-16 p-2"
        }`}
      >
   
        <button
          className={`absolute top-4 bg-amber-700 hover:bg-amber-800 w-8 h-8 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
            isOpen ? "right-[-12px]" : "right-[-16px]"
          }`}
          onClick={toggleSidebar}
        >
          {isOpen ? <FaAngleLeft className="text-sm" /> : <FaAngleRight className="text-sm" />}
        </button>

   
        <NavLink 
          to="/" 
          className={`font-bold block hover:text-amber-200 transition-colors duration-200 cursor-pointer ${
            isOpen ? "text-2xl mb-8" : "text-lg mb-6 text-center"
          }`}
        >
          {isOpen ? "PetIQ" : "PQ"}
        </NavLink>

        {/* User Profile Section */}
        {user && (
          <div className={`bg-amber-600 rounded-lg shadow-md ${
            isOpen ? "mb-8 p-3" : "mb-6 p-2 flex justify-center"
          }`}>
            <div className={`flex items-center ${isOpen ? "gap-3" : ""}`}>
              <div className={`bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm ${
                isOpen ? "w-10 h-10" : "w-8 h-8"
              }`}>
                {user.avatarUrl ? (
                  <img 
                    src={`http://localhost:5000${user.avatarUrl}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUser className={`text-amber-600 ${isOpen ? "text-lg" : "text-sm"}`} />
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

 
        <nav className="flex-1 space-y-1">
          {links.map((link, index) => (
            <NavLink
              key={index}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center rounded-lg transition-all duration-200 ${
                  isOpen ? "gap-4 p-3" : "p-2 justify-center"
                } ${
                  isActive 
                    ? "bg-amber-600 text-white shadow-md transform scale-105" 
                    : "hover:bg-amber-600 hover:text-white text-amber-100 hover:transform hover:scale-105"
                }`
              }
              title={!isOpen ? link.name : ""}
            >
              <span className={`flex-shrink-0 ${isOpen ? "text-xl" : "text-lg"}`}>{link.icon}</span>
              {isOpen && <span className="font-medium">{link.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className={`pt-4 border-t border-amber-400 ${isOpen ? "mt-8" : "mt-6"}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-lg hover:bg-red-500 w-full transition-all duration-200 text-amber-100 hover:text-white hover:transform hover:scale-105 shadow-sm ${
              isOpen ? "gap-4 p-3" : "p-2 justify-center"
            }`}
            title={!isOpen ? "Logout" : ""}
          >
            <span className={`flex-shrink-0 ${isOpen ? "text-xl" : "text-lg"}`}><FaSignOutAlt /></span>
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>


    </div>
  );
};

export default Sidebar;
