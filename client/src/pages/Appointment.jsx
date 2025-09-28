import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaClipboardCheck, FaUserMd } from "react-icons/fa";
import { useLocation } from "react-router-dom";

function Appointment() {
  const location = useLocation();

  // Get service from query param
  const queryParams = new URLSearchParams(location.search);
  const selectedService = queryParams.get("service") || "";

  const today = new Date();
  const todayDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const currentTime = today.toTimeString().slice(0, 5); // HH:mm

  const servicesData = [
    { name: "General Checkup", price: 2500 },
    { name: "Vaccination", price: 2000 },
    { name: "Surgery", price: 10000 },
    { name: "Dental Care", price: 3000 },
    { name: "Emergency Care", price: 5000 },
    { name: "Grooming", price: 1500 },
  ];

  const [formData, setFormData] = useState({
    ownerName: "",
    petName: "",
    petType: "",
    service: "",
    vet: "",
    date: todayDate,
    time: "",
    price: 0,
  });

  useEffect(() => {
    if (selectedService) {
      const serviceInfo = servicesData.find((s) => s.name === selectedService);
      setFormData((prev) => ({
        ...prev,
        service: selectedService,
        price: serviceInfo ? serviceInfo.price : 0,
      }));
    }
  }, [selectedService]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // validation: block past time on today's date
    if (formData.date === todayDate && formData.time < currentTime) {
      alert("⚠️ Please select a future time.");
      return;
    }

    alert(
      `✅ Appointment Booked!\n\n` +
        `Owner: ${formData.ownerName}\n` +
        `Pet: ${formData.petName} (${formData.petType})\n` +
        `Service: ${formData.service}\n` +
        `Price: LKR ${formData.price.toLocaleString()} / hour\n` +
        `Veterinarian: ${formData.vet}\n` +
        `Date: ${formData.date}\n` +
        `Time: ${formData.time}`
    );
  };

  const vets = [
    "Dr. Kavindu Perera",
    "Dr. Tharindu Silva",
    "Dr. Tharaka Fernando",
    "Dr. Nimal Rajapaksha",
  ];

  return (
    <div className="min-h-screen bg-yellow-50 py-16 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold text-yellow-900 text-center mb-8"
        >
          Book a Veterinary Appointment
        </motion.h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owner Name */}
          <div>
            <label className="block text-yellow-800 mb-2 font-semibold">Owner Name</label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
              placeholder="Enter your name"
            />
          </div>

          {/* Pet Name */}
          <div>
            <label className="block text-yellow-800 mb-2 font-semibold">Pet Name</label>
            <input
              type="text"
              name="petName"
              value={formData.petName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
              placeholder="Enter your pet's name"
            />
          </div>

          {/* Pet Type */}
          <div>
            <label className="block text-yellow-800 mb-2 font-semibold">Pet Type</label>
            <select
              name="petType"
              value={formData.petType}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
            >
              <option value="">Select Pet Type</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Service (non-editable, red) */}
          <div>
            <label className="block text-yellow-800 mb-2 font-semibold">Service</label>
            <p className="text-red-600 font-bold text-lg">{formData.service || "No service selected"}</p>
          </div>

          {/* Price (non-editable, red) */}
          <div>
            <label className="block text-yellow-800 mb-2 font-semibold">Price</label>
            <p className="text-red-600 font-bold text-lg">
              LKR {formData.price.toLocaleString()} / hour
            </p>
          </div>

          {/* Vet Selection */}
          <div className="md:col-span-2">
            <label className=" text-yellow-800 mb-2 font-semibold flex items-center gap-2">
              <FaUserMd className="text-yellow-600" /> Assign Veterinarian
            </label>
            <select
              name="vet"
              value={formData.vet}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
            >
              <option value="">Select Veterinarian</option>
              {vets.map((vet, index) => (
                <option key={index} value={vet}>
                  {vet}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-yellow-800 mb-2 font-semibold">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={todayDate}
              required
              className="w-full px-4 py-3 rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-yellow-800 mb-2 font-semibold">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
            />
          </div>

          {/* Submit */}
          <div className="md:col-span-2 text-center mt-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 mx-auto"
            >
              <FaClipboardCheck /> Book Appointment
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Appointment;
