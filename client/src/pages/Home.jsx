import React from "react";
import { motion } from "framer-motion";
import { FaPaw, FaStethoscope, FaCalendarCheck, FaClipboardList } from "react-icons/fa";


function Home() {
  const features = [
    {
      icon: <FaPaw size={40} className="text-yellow-500" />,
      title: "Pet Profiles",
      description: "Manage detailed medical records for all pets.",
    },
    {
      icon: <FaStethoscope size={40} className="text-yellow-500" />,
      title: "Medical Records",
      description: "Track vaccinations, treatments, and consultations.",
    },
    {
      icon: <FaCalendarCheck size={40} className="text-yellow-500" />,
      title: "Appointments",
      description: "Schedule and monitor veterinary appointments easily.",
    },
    {
      icon: <FaClipboardList size={40} className="text-yellow-500" />,
      title: "Reports",
      description: "Generate detailed reports on pets, medical records, and payments.",
    },
  ];

  return (
    <div className="min-h-screen bg-yellow-50">

      <section className="relative bg-gradient-to-r from-yellow-100 to-yellow-300 py-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="md:w-1/2 mb-12 md:mb-0"
          >
            <h1 className="text-5xl font-bold text-yellow-900 mb-6">
              Welcome to PetIQ.LK Veterinary System!
            </h1>
            <p className="text-lg text-yellow-800 mb-6">
              Complete management for pets, appointments, medical records, and pet products – all in one place.
            </p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
            >
              Get Started
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="md:w-1/2"
          >
            <img
            src="src/assets/pethome.jpg"
            alt="Pets"
            className="rounded-3xl shadow-2xl object-cover w-full h-96"
            />
          </motion.div>
        </div>
      </section>

     
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-yellow-900 mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-white p-8 rounded-3xl shadow-xl text-center hover:shadow-2xl transition-shadow"
              >
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-yellow-900 mb-2">{feature.title}</h3>
                <p className="text-yellow-800">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-yellow-100 relative overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold text-yellow-900 mb-6">Manage Your Pets Efficiently</h2>
          <p className="text-yellow-800 mb-6">
            From medical records to appointments and payments, PetCare keeps everything in one place.
          </p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
          >
            Explore Dashboard
          </motion.button>
        </motion.div>

  
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 text-yellow-400 text-5xl"
        >
          🐾
        </motion.div>
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-10 text-yellow-400 text-6xl"
        >
          🐾
        </motion.div>
      </section>
    </div>
  );
}

export default Home;
