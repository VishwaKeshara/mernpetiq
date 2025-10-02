import React from "react";
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhone } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-yellow-500 text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
    
        <div>
          <h3 className="text-xl font-bold mb-4">PetIQ</h3>
          <p className="text-yellow-100">
            Complete veterinary management system for pets. Professional care, advanced treatments, and comprehensive pet health solutions all in one place.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li className="hover:text-yellow-200 cursor-pointer">Home</li>
            <li className="hover:text-yellow-200 cursor-pointer">Pet Products</li>
            <li className="hover:text-yellow-200 cursor-pointer">Services</li>
            <li className="hover:text-yellow-200 cursor-pointer">About Us</li>
            <li className="hover:text-yellow-200 cursor-pointer">Appointments</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Contact Us</h3>
          <p className="flex items-center mb-2">
            <FaEnvelope className="mr-2" /> info@petiq.com
          </p>
          <p className="flex items-center mb-2">
            <FaPhone className="mr-2" /> +94 77 123 4567
          </p>
          <div className="flex space-x-4 mt-4">
            <FaFacebook className="hover:text-yellow-200 cursor-pointer" size={24} />
            <FaTwitter className="hover:text-yellow-200 cursor-pointer" size={24} />
            <FaInstagram className="hover:text-yellow-200 cursor-pointer" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-yellow-600 text-center py-4">
        <p className="text-yellow-100 text-sm">
          &copy; {new Date().getFullYear()} PetIQ - Veterinary Management System. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
