import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { appointmentBaseURL } from "../../axiosinstance";
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function AppointmentList() {
  const [appointmentList, setAppointmentList] = useState([]);
  const navigate = useNavigate();

  const getAllAppointmentList = async () => {
    try {
      const { data } = await appointmentBaseURL.get("/appointmentList");
      setAppointmentList(data?.appointmentList);
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
          Appointments
        </motion.h2>
        <motion.button
          onClick={() => navigate("/appointmentAdd")}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md shadow"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Add Appointment
        </motion.button>
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
              {appointmentList?.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">No appointments found</td>
                </tr>
              )}
              {appointmentList?.map((appointment, index) => (
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
                  <td className="px-4 py-3 text-gray-800">{appointment.time}</td>
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
