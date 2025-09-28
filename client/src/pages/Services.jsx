import React from "react";
import { motion } from "framer-motion";
import { FaStethoscope, FaSyringe, FaCut, FaTeeth, FaFirstAid, FaBath } from "react-icons/fa";
import { Link } from "react-router-dom";

function Services() {
  const services = [
    {
      icon: <FaStethoscope size={40} className="text-yellow-600" />,
      title: "General Checkup",
      description: "Routine health examinations to keep your pet healthy.",
      price: 2500,
    },
    {
      icon: <FaSyringe size={40} className="text-yellow-600" />,
      title: "Vaccination",
      description: "Protect pets from diseases with timely vaccinations.",
      price: 2000,
    },
    {
      icon: <FaCut size={40} className="text-yellow-600" />,
      title: "Surgery",
      description: "Safe and professional surgical procedures for pets.",
      price: 10000,
    },
    {
      icon: <FaTeeth size={40} className="text-yellow-600" />,
      title: "Dental Care",
      description: "Prevent oral diseases and keep your pet’s teeth healthy.",
      price: 3000,
    },
    {
      icon: <FaFirstAid size={40} className="text-yellow-600" />,
      title: "Emergency Care",
      description: "24/7 emergency treatment for critical health issues.",
      price: 5000,
    },
    {
      icon: <FaBath size={40} className="text-yellow-600" />,
      title: "Grooming",
      description: "Keep your pets clean, stylish, and comfortable.",
      price: 1500,
    },
  ];

  return (
    <div className="min-h-screen bg-yellow-50 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold text-yellow-900 text-center mb-12"
        >
          Our Veterinary Services
        </motion.h2>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-white p-8 rounded-3xl shadow-xl text-center hover:shadow-2xl transition-shadow"
            >
              <div className="mb-4 flex justify-center">{service.icon}</div>
              <h3 className="text-xl font-semibold text-yellow-900 mb-2">{service.title}</h3>
              <p className="text-yellow-800 mb-2">{service.description}</p>
              {/* Price per hour */}
              <p className="text-yellow-700 font-bold mb-4">
                LKR {service.price.toLocaleString()} / hour
              </p>
              {/* Pass service name as query param */}
              <Link to={`/appointment?service=${encodeURIComponent(service.title)}`}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-xl shadow-md"
                >
                  Book Now
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Services;
