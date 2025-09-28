
import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhone } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-yellow-500 text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div>
          <h3 className="text-xl font-bold mb-4">PetIQ.LK</h3>
          <p className="text-yellow-100">
            Complete veterinary management system for pets. Track medical records, appointments,
            products, and reports all in one place.
          </p>
        </div>

        
        <div>
          <h3 className="text-xl font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link className="hover:text-yellow-200" to="/">Home</Link></li>
            <li><Link className="hover:text-yellow-200" to="/pets">Pets</Link></li>
            <li><Link className="hover:text-yellow-200" to="/appointments">Appointments</Link></li>
            <li><Link className="hover:text-yellow-200" to="/records">Medical Records</Link></li>
            <li><Link className="hover:text-yellow-200" to="/products">Products</Link></li>
          </ul>
        </div>

        
        <div>
          <h3 className="text-xl font-bold mb-4">Contact Us</h3>
          <p className="flex items-center mb-2">
            <FaEnvelope className="mr-2" /> info@petiq.lk
          </p>
          <p className="flex items-center mb-2">
            <FaPhone className="mr-2" /> +94 77 123 4567
          </p>
          <div className="flex space-x-4 mt-4">
            <a href="#" aria-label="Facebook" className="hover:text-yellow-200"><FaFacebook size={24} /></a>
            <a href="#" aria-label="Twitter" className="hover:text-yellow-200"><FaTwitter size={24} /></a>
            <a href="#" aria-label="Instagram" className="hover:text-yellow-200"><FaInstagram size={24} /></a>
          </div>
        </div>
      </div>

      <div className="bg-yellow-600 text-center py-4">
        <p className="text-yellow-100 text-sm">
          &copy; {new Date().getFullYear()} <span className="font-semibold">PetIQ.LK</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
