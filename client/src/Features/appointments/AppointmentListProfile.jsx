import React, { useEffect, useState } from "react";
import { appointmentBaseURL } from "../../axiosinstance.js";
import { MdDelete } from "react-icons/md";
import { FaPen, FaSearch, FaCalendarAlt, FaPlus } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AppointmentList({ isUserProfile = false }) {
  const [appointmentList, setAppointmentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

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
      } catch {
        ({ data } = await appointmentBaseURL.get("/appointmentList"));
      }
      let items = data?.appointmentList ?? data?.appointments ?? [];
      
      // Filter appointments for user profile view
      if (isUserProfile && user) {
        items = items.filter(appointment => 
          appointment.ownerName?.toLowerCase() === user.name?.toLowerCase() ||
          appointment.ownerEmail?.toLowerCase() === user.email?.toLowerCase()
        );
      }
      
      setAppointmentList(items);
      
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
    navigate(`/appointmentAdd`, { 
      state: { 
        ...appointment, 
        fromProfile: isUserProfile 
      } 
    });
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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 px-5 py-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {isUserProfile ? "My Appointments" : "Appointments Details"}
        </h2>
        <p className="text-gray-600">
          {isUserProfile ? "View and manage your scheduled appointments" : "Manage and track all pet appointments"}
        </p>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
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
          <button
            onClick={() => navigate("/appointmentAdd")}
            className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
          >
            <FaPlus className="text-lg" />
            {isUserProfile ? "Book Appointment" : "Add Appointment"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {(filteredAppointments?.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FaCalendarAlt className="text-4xl text-gray-300 mb-4" />
                      <p className="text-lg font-medium">
                        {isUserProfile ? "No appointments found" : "No appointments found"}
                      </p>
                      <p className="text-sm mt-1">
                        {searchQuery 
                          ? "Try adjusting your search criteria" 
                          : isUserProfile 
                            ? "Book your first appointment to get started" 
                            : "Get started by adding your first appointment"
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredAppointments?.map((appointment, index) => (
                <tr
                  key={appointment._id || index}
                  className="hover:bg-amber-50/50 transition-colors duration-150"
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
                      <button
                        className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        onClick={() => handleUpdate(appointment)}
                      >
                        <FaPen className="text-xs" />
                        Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        onClick={() => handleDelete(appointment._id)}
                      >
                        <MdDelete className="text-sm" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AppointmentList;
