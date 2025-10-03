import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { appointmentBaseURL } from "../../axiosinstance.js";
import { MdDelete } from "react-icons/md";
import { FaPen, FaSearch, FaCalendarAlt, FaPlus, FaTachometerAlt, FaDownload, FaDollarSign, FaChartLine } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function AppointmentList() {
  const [appointmentList, setAppointmentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalIncome: 0
  });
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
      setLoading(true);
      // Prefer RESTful route, fall back to compatibility
      let data;
      try {
        ({ data } = await appointmentBaseURL.get("/"));
      } catch (_) {
        ({ data } = await appointmentBaseURL.get("/appointmentList"));
      }
      const items = data?.appointmentList ?? data?.appointments ?? [];
      setAppointmentList(items);
      
      // Calculate statistics
      const totalAppointments = items.length;
      const totalIncome = items.reduce((sum, appointment) => {
        const price = Number(appointment.price) || 0;
        return sum + price;
      }, 0);
      
      setStats({
        totalAppointments,
        totalIncome
      });
      
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllAppointmentList();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this appointment?");
    if (!confirmDelete) return;

    try {
      const { data } = await appointmentBaseURL.post("/deleteAppointment", { id });
      if (data?.success) {
        alert(data?.message || "Appointment deleted successfully");
        getAllAppointmentList();
      }
    } catch (error) {
      console.log(error);
      alert("Failed to delete appointment. Please try again.");
    }
  };

  const handleUpdate = (appointment) => {
    // Navigate to the add/update form with the selected appointment as state
    // Pass a flag so the form knows to return to admin page after update
    navigate(`/appointmentAdd`, { state: { ...appointment, fromAdmin: isAdminView } });
  };

  const handleDownloadPDF = () => {
    try {
      console.log('PDF download started');
      
      // Check if appointments are still loading
      if (loading) {
        alert('Please wait for appointments to finish loading...');
        return;
      }
      
      // Check if appointments are available
      if (!filteredAppointments || filteredAppointments.length === 0) {
        alert('No appointments available to download');
        return;
      }

      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Appointments Report', 20, 20);
      
      // Add generation date
      const now = new Date();
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 20, 30);
      
      // Prepare data for table
      const tableData = filteredAppointments.map((appointment, index) => [
        (index + 1).toString(),
        appointment.ownerName || 'N/A',
        appointment.petName || 'N/A',
        appointment.petType || 'N/A',
        appointment.service || 'N/A',
        appointment.vet || 'N/A',
        appointment.date ? new Date(appointment.date).toLocaleDateString('en-GB') : 'N/A',
        appointment.time ? toAmPm(appointment.time) : 'N/A',
        `Rs. ${(appointment.price || 0).toLocaleString()}`
      ]);
      
      // Create table
      autoTable(doc, {
        head: [['#', 'Owner', 'Pet Name', 'Pet Type', 'Service', 'Vet', 'Date', 'Time', 'Price (Rs.)']],
        body: tableData,
        startY: 40,
        headStyles: {
          fillColor: [255, 165, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 }, // #
          1: { cellWidth: 25 }, // Owner
          2: { cellWidth: 20 }, // Pet Name
          3: { cellWidth: 18 }, // Pet Type
          4: { cellWidth: 25 }, // Service
          5: { cellWidth: 20 }, // Vet
          6: { cellWidth: 20 }, // Date
          7: { cellWidth: 15 }, // Time
          8: { cellWidth: 20 } // Price
        }
      });
      
      // Add summary
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Appointments: ${filteredAppointments.length}`, 20, finalY);
      
      const totalIncome = filteredAppointments.reduce((sum, appointment) => sum + (Number(appointment.price) || 0), 0);
      doc.text(`Total Income: Rs. ${totalIncome.toLocaleString()}`, 20, finalY + 8);
      
      // Save PDF
      doc.save('appointments_report.pdf');
      console.log('PDF saved successfully');
      
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Error creating PDF: ' + error.message);
    }
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

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-amber-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FaCalendarAlt className="text-amber-500 text-xl" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 px-5 py-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-8">
        <motion.h2
          className="text-3xl font-bold text-gray-800 mb-2"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          Appointments Details
        </motion.h2>
        <motion.p
          className="text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Manage and track all pet appointments
        </motion.p>
      </div>

      {/* Statistics Cards - Only show in admin view */}
      {isAdminView && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Total Appointments Card */}
          <motion.div
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Total Appointments</h3>
                <p className="text-3xl font-bold mt-2">{stats.totalAppointments}</p>
                <p className="text-sm opacity-80 mt-1">
                  {filteredAppointments?.length !== stats.totalAppointments && searchQuery 
                    ? `${filteredAppointments?.length} filtered` 
                    : "All appointments"}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaCalendarAlt className="text-2xl" />
              </div>
            </div>
          </motion.div>

          {/* Total Income Card */}
          <motion.div
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Total Income Value</h3>
                <p className="text-3xl font-bold mt-2">
                  Rs. {stats.totalIncome.toLocaleString()}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  {searchQuery && filteredAppointments?.length !== stats.totalAppointments
                    ? `Rs. ${filteredAppointments?.reduce((sum, appointment) => sum + (Number(appointment.price) || 0), 0).toLocaleString()} filtered`
                    : "Total revenue generated"}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaDollarSign className="text-2xl" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Search Bar and Action Buttons */}
      <motion.div 
        className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Search Bar */}
        <div className="w-full md:flex-1 md:max-w-lg">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
              <FaSearch size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appointments (owner, pet, service, vet, date...)"
              aria-label="Search appointments"
              className="w-full pl-11 pr-10 py-3 rounded-xl border-2 border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                aria-label="Clear search"
              >
                <IoClose size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Found <span className="font-semibold text-amber-600">{filteredAppointments?.length}</span> appointment(s)
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isAdminView && (
            <motion.button
              onClick={handleDownloadPDF}
              className="flex-1 md:flex-none bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaDownload className="text-lg" />
              Download PDF
            </motion.button>
          )}
          <motion.button
            onClick={() => navigate("/appointmentAdd")}
            className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaPlus className="text-lg" />
            Add Appointment
          </motion.button>
        </div>
      </motion.div>

      <motion.div 
        className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.4 }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-amber-50 to-amber-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Owner Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Pet Details</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Veterinarian</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Price (Rs.)</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
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
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FaCalendarAlt className="text-4xl text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No appointments found</p>
                      <p className="text-sm mt-1">
                        {searchQuery ? "Try adjusting your search criteria" : "Get started by adding your first appointment"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredAppointments?.map((appointment, index) => (
                <motion.tr
                  key={appointment._id || index}
                  className="hover:bg-amber-50/50 transition-colors duration-150"
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{appointment.ownerName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">{appointment.petName}</div>
                      <div className="text-gray-500 capitalize">{appointment.petType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {appointment.service}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{appointment.vet}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">{appointment.date}</div>
                      <div className="text-gray-500">{toAmPm(appointment.time)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-green-600">
                      Rs. {Number(appointment.price || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <motion.button
                        className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        onClick={() => handleUpdate(appointment)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaPen className="text-xs" />
                        Edit
                      </motion.button>
                      <motion.button
                        className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        onClick={() => handleDelete(appointment._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MdDelete className="text-sm" />
                        Delete
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
