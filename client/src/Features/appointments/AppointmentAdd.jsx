import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { appointmentBaseURL } from "../../axiosinstance.js";

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
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [conflictWarning, setConflictWarning] = useState("");

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm((prev) => {
      const updated = { ...prev, [name]: value };
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
    try {
      if (Object.values(appointmentForm).some((f) => !f)) {
        alert("All fields are required!");
        return;
      }
      if (
        appointmentForm.time < OPEN_TIME ||
        appointmentForm.time > LAST_START_TIME
      ) {
        alert("Please select a time between 08:00 and 23:00.");
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
        alert("Selected time conflicts with another appointment.");
        return;
      }
      const endpoint = isUpdating ? "/updateAppointment" : "/addappointment";
      const { data } = await appointmentBaseURL.post(endpoint, appointmentForm);
      if (data?.success) {
        alert(data.message);
        if (isUpdating) {
          // If navigated from admin, return to admin appointments list
          const fromAdmin = Boolean(location.state && location.state.fromAdmin);
          if (fromAdmin) {
            navigate("/admin/appointments");
          } else {
            navigate("/appointmentList");
          }
        } else {
          navigate("/payment", { state: { appointment: appointmentForm } });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <motion.div
      className={`${isAdminView ? "w-full" : "w-full min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 flex justify-center items-center px-5 py-10"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className={`${isAdminView ? "w-full bg-white shadow-lg rounded-xl p-6 border border-gray-100" : "w-full max-w-3xl bg-white shadow-xl rounded-2xl p-8 md:p-10 border border-amber-200"}`}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="text-3xl md:text-4xl font-extrabold text-amber-700 mb-2 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isUpdating ? "Update Appointment" : "Book an Appointment"}
        </motion.h2>
        <p className={`text-center text-gray-600 ${isAdminView ? "mb-6" : "mb-8"}`}>Please enter your pet and service details to schedule a visit.</p>

        {/* Form Fields */}
        <div className="flex flex-col gap-6">
         {[
            { id: "ownerName", label: "Owner Name", type: "text" },
            { id: "petName", label: "Pet Name", type: "text" },
            { id: "petType", label: "Pet Type", type: "text" },
            { id: "service", label: "Service", type: "text" },
            { id: "price", label: "Price", type: "number" },
           ].map((f) => {
             const isLockedField = isUpdating && (f.id === "service" || f.id === "price");
             return (
              <div key={f.id} className="relative">
                 <input
                   type={f.type}
                   id={f.id}
                   name={f.id}
                   placeholder=" "
                   value={appointmentForm[f.id]}
                   onChange={handleFormChange}
                   disabled={isLockedField}
                  className={`peer w-full border-2 rounded-xl px-4 pt-5 pb-2 h-14 text-gray-800 placeholder-transparent outline-none transition ${isLockedField ? "border-gray-200 bg-gray-100 cursor-not-allowed" : "border-amber-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200"}`}
                 />
                 <label
                   htmlFor={f.id}
                  className="absolute left-4 top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-amber-600"
                 >
                   {f.label}
                 </label>
               </div>
             );
           })}

          {/* Vet Dropdown */}
          <div className="relative">
            <select
              id="vet"
              name="vet"
              value={appointmentForm.vet}
              onChange={handleFormChange}
            className="peer w-full border-2 border-amber-200 bg-white rounded-xl px-4 pt-5 pb-2 h-14 text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
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
              className="absolute left-4 top-2 text-xs text-amber-600 bg-white px-1 rounded"
            >
              Vet
            </label>
          </div>

          {/* Date & Time */}
          <div className="flex gap-6 flex-col md:flex-row">
            <div className="relative flex-1">
              <input
                type="date"
                id="date"
                name="date"
                value={appointmentForm.date}
                onChange={handleFormChange}
                min={minDate}
                className="peer w-full border-2 border-amber-200 bg-white rounded-xl px-4 pt-5 pb-2 h-14 text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
              />
              <label
                htmlFor="date"
                className="absolute left-4 top-2 text-xs text-amber-600 bg-white px-1 rounded"
              >
                Date
              </label>
            </div>

            <div className="relative w-full md:w-48">
              <input
                type="time"
                id="time"
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
                className="peer w-full border-2 border-amber-200 bg-white rounded-xl px-4 pt-5 pb-2 h-14 text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
              />
              <label
                htmlFor="time"
                className="absolute left-4 top-2 text-xs text-amber-600 bg-white px-1 rounded"
              >
                Time
              </label>
              {appointmentForm.time && (
                <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                  Duration: {appointmentForm.time} -{" "}
                  {getEndTime(appointmentForm.time)} (1 hour)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conflict Warning */}
        {conflictWarning && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">{conflictWarning}</p>
          </div>
        )}

        {/* Button */}
        <div className={`mt-10 flex ${isAdminView ? "justify-start" : "justify-center"}`}>
          <motion.button
            onClick={handleSubmit}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all duration-200"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {isUpdating ? "Update Appointment" : "Submit"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AppointmentAdd;
