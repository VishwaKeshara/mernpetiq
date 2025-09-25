import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { appointmentBaseURL } from "../../axiosinstance";

function AppointmentAdd() {
  const location = useLocation();
  const navigate = useNavigate();

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const minTime = today.toTimeString().slice(0, 5);

  const vets = [
    "Tharaka Fernando",
    "Tharindu Perera",
    "Nethmika Bandara",
    "Dayan Devinda",
    "Rashmika Dilsahan",
  ];

  const [appointmentForm, setAppointmentForm] = useState({
    ownerName: "",
    petName: "",
    petType: "",
    service: "",
    price: "",
    vet: "",
    date: "",
    time: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (location.state && location.state._id) {
      setAppointmentForm({
        ownerName: location.state.ownerName || "",
        petName: location.state.petName || "",
        petType: location.state.petType || "",
        service: location.state.service || "",
        price: location.state.price || "",
        vet: location.state.vet || "",
        date: location.state.date || "",
        time: location.state.time || "",
        _id: location.state._id,
      });
      setIsUpdating(true);
    }
  }, [location.state]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (Object.values(appointmentForm).some((f) => !f)) {
        alert("All fields are required!");
        return;
      }

      if (isUpdating) {
        const { data } = await appointmentBaseURL.post(
          "/updateAppointment",
          appointmentForm
        );
        if (data?.success) {
          alert(data.message);
          navigate("/appointmentList");
        }
      } else {
        const { data } = await appointmentBaseURL.post(
          "/addappointment",
          appointmentForm
        );
        if (data?.success) {
          alert(data.message);
          setAppointmentForm({
            ownerName: "",
            petName: "",
            petType: "",
            service: "",
            price: "",
            vet: "",
            date: "",
            time: "",
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <motion.div
      className="w-full min-h-screen flex justify-center items-center bg-gradient-to-br from-amber-200 via-pink-100 to-amber-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="w-full max-w-2xl bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl p-10 overflow-y-auto max-h-[90vh]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.h2
          className="text-4xl font-extrabold text-gray-800 mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-pink-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isUpdating ? "Update Appointment" : "Book an Appointment"}
        </motion.h2>

        {/* Form */}
        <div className="flex flex-col gap-8">
          {[
            { id: "ownerName", label: "Owner Name", type: "text" },
            { id: "petName", label: "Pet Name", type: "text" },
            { id: "petType", label: "Pet Type", type: "text" },
            { id: "service", label: "Service", type: "text" },
            { id: "price", label: "Price", type: "number" },
          ].map((field) => (
            <div key={field.id} className="relative">
              <input
                type={field.type}
                id={field.id}
                name={field.id}
                placeholder=" "
                value={appointmentForm[field.id]}
                onChange={handleFormChange}
                className="peer w-full border-2 border-gray-300 bg-white/60 rounded-xl px-4 pt-5 pb-2 h-14 text-gray-800 placeholder-transparent focus:border-amber-500 focus:ring-2 focus:ring-amber-300 outline-none transition"
              />
              <label
                htmlFor={field.id}
                className="absolute left-4 top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-amber-600"
              >
                {field.label}
              </label>
            </div>
          ))}

          {/* Vet Dropdown */}
          <div className="relative">
            <select
              id="vet"
              name="vet"
              value={appointmentForm.vet}
              onChange={handleFormChange}
              className="peer w-full border-2 border-gray-300 bg-white/60 rounded-xl px-4 pt-5 pb-2 h-14 text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-300 outline-none transition"
            >
              <option value="">Select a vet</option>
              {vets.map((vet, i) => (
                <option key={i} value={vet}>
                  {vet}
                </option>
              ))}
            </select>
            <label
              htmlFor="vet"
              className="absolute left-4 top-2 text-xs text-amber-600 bg-white/70 px-1 rounded peer-focus:text-amber-600"
            >
              Vet
            </label>
          </div>

          {/* Date & Time */}
          <div className="flex gap-6">
            <div className="relative flex-1">
              <input
                type="date"
                id="date"
                name="date"
                value={appointmentForm.date}
                onChange={handleFormChange}
                min={minDate}
                className="peer w-full border-2 border-gray-300 bg-white/60 rounded-xl px-4 pt-5 pb-2 h-14 text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-300 outline-none transition"
              />
              <label
                htmlFor="date"
                className="absolute left-4 top-2 text-xs text-amber-600 bg-white/70 px-1 rounded peer-focus:text-amber-600"
              >
                Date
              </label>
            </div>

            <div className="relative w-40">
              <input
                type="time"
                id="time"
                name="time"
                value={appointmentForm.time}
                onChange={handleFormChange}
                min={appointmentForm.date === minDate ? minTime : undefined}
                className="peer w-full border-2 border-gray-300 bg-white/60 rounded-xl px-4 pt-5 pb-2 h-14 text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-300 outline-none transition"
              />
              <label
                htmlFor="time"
                className="absolute left-4 top-2 text-xs text-amber-600 bg-white/70 px-1 rounded peer-focus:text-amber-600"
              >
                Time
              </label>
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="mt-12 flex justify-center">
          <motion.button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-bold py-3 px-12 rounded-2xl shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {isUpdating ? "Update Appointment" : "Add Appointment"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AppointmentAdd;
