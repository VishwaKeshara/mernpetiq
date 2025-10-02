import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { appointmentBaseURL } from "../../axiosinstance.js";
import { MdDelete } from "react-icons/md";
import { FaPen, FaSearch } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";

function AppointmentList() {
  const [appointmentList, setAppointmentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if accessed from admin panel
  const isAdminView = location.pathname.includes('/admin/');

  const toAmPm = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const getAllAppointmentList = async () => {
    try {
      // Prefer RESTful route, fall back to compatibility
      let data;
      try {
        ({ data } = await appointmentBaseURL.get("/"));
      } catch (_) {
        ({ data } = await appointmentBaseURL.get("/appointmentList"));
      }
      const items = data?.appointmentList ?? data?.appointments ?? [];
      setAppointmentList(items);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllAppointmentList();
  }, []);

  const handleDelete = async (id) => {
    try {
      const { data } = await appointmentBaseURL.post("/deleteAppointment", { id });
      if (data?.success) {
        alert(data?.message);
        getAllAppointmentList();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdate = (appointment) => {
    // Navigate to the add/update form with the selected appointment as state
    navigate(`/appointmentAdd`, { state: appointment });
  };

  const filteredAppointments = appointmentList?.filter((appointment) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const fieldsToSearch = [
      appointment?.ownerName,
      appointment?.petName,
      appointment?.petType,
      appointment?.service,
      appointment?.vet,
      appointment?.date,
      toAmPm(appointment?.time),
      String(appointment?.price),
    ];
    return fieldsToSearch.some((value) => String(value || "").toLowerCase().includes(query));
  });


  return (
    <motion.div
      className="w-full px-5 py-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <motion.h2
          className="text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          Appointments Details
        </motion.h2>
        <motion.button
          onClick={() => navigate("/services")}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md shadow"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Add Appointment
        </motion.button>
      </div>

      <div className="mb-4 flex justify-end">
        <div className="relative w-full md:w-96">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <FaSearch size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search appointments (owner, pet, service, vet, date)"
            aria-label="Search appointments"
            className="w-full pl-10 pr-10 py-2 rounded-full border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Clear search"
            >
              <IoClose size={18} />
            </button>
          )}
        </div>
      </div>

      <motion.div className="bg-white shadow rounded-lg overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Owner Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pet Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pet Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Vet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <motion.tbody
              className="bg-white divide-y divide-gray-200"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 1 },
                show: { opacity: 1, transition: { staggerChildren: 0.05 } },
              }}
            >
              {(filteredAppointments?.length === 0) && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">No appointments found</td>
                </tr>
              )}
              {filteredAppointments?.map((appointment, index) => (
                <motion.tr
                  key={index}
                  className="hover:bg-amber-50"
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                >
                  <td className="px-4 py-3 text-gray-800">{appointment.ownerName}</td>
                  <td className="px-4 py-3 text-gray-800">{appointment.petName}</td>
                  <td className="px-4 py-3 text-gray-800">{appointment.petType}</td>
                  <td className="px-4 py-3 text-gray-800">{appointment.service}</td>
                  <td className="px-4 py-3 text-gray-800">{appointment.price}</td>
                  <td className="px-4 py-3 text-gray-800">{appointment.vet}</td>
                  <td className="px-4 py-3 text-gray-800">{appointment.date}</td>
                  <td className="px-4 py-3 text-gray-800">{toAmPm(appointment.time)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <motion.button
                        className="inline-flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-md"
                        onClick={() => handleDelete(appointment._id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MdDelete /> Delete
                      </motion.button>
                      <motion.button
                        className="inline-flex items-center gap-2 bg-amber-500 text-white hover:bg-amber-600 px-3 py-1 rounded-md"
                        onClick={() => handleUpdate(appointment)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaPen /> Edit
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AppointmentList;
