import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { appointmentBaseURL } from "../../axiosinstance.js";
import { FaCalendarAlt, FaClock, FaUser, FaPaw, FaStethoscope, FaDollarSign, FaUserMd, FaSave, FaTimes, FaExclamationTriangle } from "react-icons/fa";

function AppointmentAdd() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminView = location.pathname.includes('/admin/');

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const minTime = today.toTimeString().slice(0, 5);
  const OPEN_TIME = "08:00";
  const LAST_START_TIME = "23:00";

  const vets = [
    "Dr.Tharaka Fernando",
    "Dr.Tharindu Perera",
    "Dr.Nethmika Bandara",
    "Dr.Dayan Devinda",
    "Dr.Rashmika Dilsahan",
  ];

  const petTypes = [
    "Dog", "Cat", "Bird", "Rabbit", "Hamster", "Fish", "Reptile", "Other"
  ];

  const services = [
    { name: "General Checkup", price: 2500 },
    { name: "Vaccination", price: 3500 },
    { name: "Surgery", price: 15000 },
    { name: "Dental Care", price: 5000 },
    { name: "Emergency Care", price: 8000 },
    { name: "Grooming", price: 2000 },
    { name: "Blood Test", price: 4000 },
    { name: "X-Ray", price: 6000 }
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

  const [errors, setErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [conflictWarning, setConflictWarning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Prefill from query params (service/price)
  useEffect(() => {
    if (!isUpdating && location.search) {
      const params = new URLSearchParams(location.search);
      const service = params.get("service") || "";
      const price = params.get("price") || "";
      if (service || price) {
        setAppointmentForm((prev) => ({
          ...prev,
          service,
          price: price ? String(price) : prev.price,
        }));
      }
    }
  }, [isUpdating, location.search]);

  // Fetch existing appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await appointmentBaseURL.get("/appointmentList");
        setExistingAppointments(data?.appointmentList || []);
      } catch (error) {
        console.log("Error fetching appointments:", error);
      }
    };
    fetchAppointments();
  }, []);

  const getEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const checkForConflict = (vet, date, time, excludeId = null) => {
    if (!vet || !date || !time) return false;
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };
    const newStart = timeToMinutes(time);
    const newEnd = newStart + 60;
    return existingAppointments.some((a) => {
      if (a.vet !== vet || a.date !== date || a._id === excludeId) return false;
      const existingStart = timeToMinutes(a.time);
      const existingEnd = existingStart + 60;
      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!appointmentForm.ownerName.trim()) {
      newErrors.ownerName = "Owner name is required";
    }
    
    if (!appointmentForm.petName.trim()) {
      newErrors.petName = "Pet name is required";
    }
    
    if (!appointmentForm.petType) {
      newErrors.petType = "Pet type is required";
    }
    
    if (!appointmentForm.service) {
      newErrors.service = "Service is required";
    }
    
    if (!appointmentForm.price || appointmentForm.price <= 0) {
      newErrors.price = "Valid price is required";
    }
    
    if (!appointmentForm.vet) {
      newErrors.vet = "Veterinarian selection is required";
    }
    
    if (!appointmentForm.date) {
      newErrors.date = "Date is required";
    }
    
    if (!appointmentForm.time) {
      newErrors.time = "Time is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleServiceChange = (serviceName) => {
    const selectedService = services.find(s => s.name === serviceName);
    setAppointmentForm(prev => ({
      ...prev,
      service: serviceName,
      price: selectedService ? selectedService.price.toString() : ""
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    
    setAppointmentForm((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Check for conflicts when relevant fields change
      if (
        (name === "vet" || name === "date" || name === "time") &&
        updated.vet &&
        updated.date &&
        updated.time
      ) {
        const hasConflict = checkForConflict(
          updated.vet,
          updated.date,
          updated.time,
          updated._id
        );
        setConflictWarning(
          hasConflict
            ? `⚠️ Dr. ${updated.vet} already has an appointment on ${updated.date} at ${updated.time}.`
            : ""
        );
      } else {
        setConflictWarning("");
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (
      appointmentForm.time < OPEN_TIME ||
      appointmentForm.time > LAST_START_TIME
    ) {
      setErrors(prev => ({
        ...prev,
        time: "Please select a time between 08:00 and 23:00"
      }));
      return;
    }
    
    if (
      checkForConflict(
        appointmentForm.vet,
        appointmentForm.date,
        appointmentForm.time,
        appointmentForm._id
      )
    ) {
      setErrors(prev => ({
        ...prev,
        time: "Selected time conflicts with another appointment"
      }));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const endpoint = isUpdating ? "/updateAppointment" : "/addappointment";
      const { data } = await appointmentBaseURL.post(endpoint, appointmentForm);
      
      if (data?.success) {
        // Show success message with better UX
        if (isUpdating) {
          const fromAdmin = Boolean(location.state && location.state.fromAdmin);
          if (fromAdmin) {
            navigate("/admin/appointments", { 
              state: { message: "Appointment updated successfully!" }
            });
          } else {
            navigate("/appointmentList", { 
              state: { message: "Appointment updated successfully!" }
            });
          }
        } else {
          navigate("/payment", { 
            state: { 
              appointment: appointmentForm,
              message: "Appointment created successfully! Please proceed with payment."
            }
          });
        }
      }
    } catch (error) {
      console.error("Error submitting appointment:", error);
      setErrors({ submit: "Failed to submit appointment. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isAdminView) {
      navigate("/admin/appointments");
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <motion.div
      className={`${isAdminView 
        ? "w-full" 
        : "w-full min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50 flex justify-center items-center px-4 py-8"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className={`${isAdminView 
          ? "w-full bg-white shadow-lg rounded-xl border border-gray-200" 
          : "w-full max-w-4xl bg-white shadow-2xl rounded-2xl border border-indigo-100"
        } overflow-hidden`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <div className={`${isAdminView 
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 p-6" 
          : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8"
        }`}>
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-full">
                <FaCalendarAlt className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  {isUpdating ? "Update Appointment" : "Book New Appointment"}
                </h2>
                <p className="text-white/80 text-sm md:text-base">
                  {isUpdating 
                    ? "Modify your appointment details below" 
                    : "Schedule a visit for your beloved pet"
                  }
                </p>
              </div>
            </div>
            {!isAdminView && (
              <button
                onClick={handleCancel}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
              >
                <FaTimes className="text-white" />
              </button>
            )}
          </motion.div>
        </div>

        {/* Form Section */}
        <div className={`${isAdminView ? "p-6" : "p-8"}`}>
          {/* Error Display */}
          {errors.submit && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FaExclamationTriangle className="text-red-500" />
              <span className="text-red-700">{errors.submit}</span>
            </motion.div>
          )}

          {/* Conflict Warning */}
          {conflictWarning && (
            <motion.div
              className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FaExclamationTriangle className="text-amber-500" />
              <span className="text-amber-700">{conflictWarning}</span>
            </motion.div>
          )}

          <form className="space-y-6">
            {/* Owner and Pet Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Owner Name */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <FaUser className="text-blue-500" />
                  <span>Owner Name</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={appointmentForm.ownerName}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.ownerName
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                  placeholder="Enter owner's full name"
                />
                {errors.ownerName && (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <FaExclamationTriangle />
                    <span>{errors.ownerName}</span>
                  </p>
                )}
              </div>

              {/* Pet Name */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <FaPaw className="text-green-500" />
                  <span>Pet Name</span>
                </label>
                <input
                  type="text"
                  name="petName"
                  value={appointmentForm.petName}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.petName
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                  placeholder="Enter pet's name"
                />
                {errors.petName && (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <FaExclamationTriangle />
                    <span>{errors.petName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Pet Type */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <FaPaw className="text-purple-500" />
                <span>Pet Type</span>
              </label>
              <select
                name="petType"
                value={appointmentForm.petType}
                onChange={handleFormChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.petType
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                }`}
              >
                <option value="">Select pet type</option>
                {petTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.petType && (
                <p className="text-red-500 text-xs flex items-center space-x-1">
                  <FaExclamationTriangle />
                  <span>{errors.petType}</span>
                </p>
              )}
            </div>

            {/* Service and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <FaStethoscope className="text-indigo-500" />
                  <span>Service</span>
                </label>
                <select
                  name="service"
                  value={appointmentForm.service}
                  onChange={(e) => {
                    if (!isUpdating) {
                      handleServiceChange(e.target.value);
                    } else {
                      handleFormChange(e);
                    }
                  }}
                  disabled={isUpdating}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    isUpdating
                      ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                      : errors.service
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.name} value={service.name}>
                      {service.name} - LKR {service.price.toLocaleString()}
                    </option>
                  ))}
                </select>
                {errors.service && (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <FaExclamationTriangle />
                    <span>{errors.service}</span>
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <FaDollarSign className="text-green-500" />
                  <span>Price (LKR)</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={appointmentForm.price}
                  onChange={handleFormChange}
                  disabled={isUpdating}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    isUpdating
                      ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                      : errors.price
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                  placeholder="Enter service price"
                />
                {errors.price && (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <FaExclamationTriangle />
                    <span>{errors.price}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Veterinarian */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <FaUserMd className="text-blue-500" />
                <span>Veterinarian</span>
              </label>
              <select
                name="vet"
                value={appointmentForm.vet}
                onChange={handleFormChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.vet
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                }`}
              >
                <option value="">Select a veterinarian</option>
                {vets.map((vet) => (
                  <option key={vet} value={vet}>
                    {vet}
                  </option>
                ))}
              </select>
              {errors.vet && (
                <p className="text-red-500 text-xs flex items-center space-x-1">
                  <FaExclamationTriangle />
                  <span>{errors.vet}</span>
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <FaCalendarAlt className="text-red-500" />
                  <span>Appointment Date</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={appointmentForm.date}
                  onChange={handleFormChange}
                  min={minDate}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.date
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                />
                {errors.date && (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <FaExclamationTriangle />
                    <span>{errors.date}</span>
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <FaClock className="text-orange-500" />
                  <span>Appointment Time</span>
                </label>
                <input
                  type="time"
                  name="time"
                  value={appointmentForm.time}
                  onChange={handleFormChange}
                  min={
                    appointmentForm.date === minDate
                      ? minTime > OPEN_TIME
                        ? minTime
                        : OPEN_TIME
                      : OPEN_TIME
                  }
                  max={LAST_START_TIME}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.time
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                />
                {appointmentForm.time && (
                  <div className="text-xs text-gray-600 flex items-center space-x-1">
                    <FaClock />
                    <span>
                      Duration: {appointmentForm.time} - {getEndTime(appointmentForm.time)} (1 hour)
                    </span>
                  </div>
                )}
                {errors.time && (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <FaExclamationTriangle />
                    <span>{errors.time}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <motion.button
                type="button"
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaTimes />
                <span>Cancel</span>
              </motion.button>
              
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              >
                <FaSave />
                <span>
                  {isSubmitting 
                    ? "Processing..." 
                    : isUpdating 
                    ? "Update Appointment" 
                    : "Book Appointment"
                  }
                </span>
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AppointmentAdd;
