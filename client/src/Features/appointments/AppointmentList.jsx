import React, { useEffect, useState } from "react";
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
    <div className="w-full bg-white divide-y divide-gray-200">
      <table className="w-full bg-white divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th>Owner Name</th>
            <th>Pet Name</th>
            <th>Pet Type</th>
            <th>Service</th>
            <th>Price</th>
            <th>Vet</th>
            <th>Date</th>
            <th>Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {appointmentList?.map((appointment, index) => (
            <tr key={index} className="hover:bg-gray-200">
              <td>{appointment.ownerName}</td>
              <td>{appointment.petName}</td>
              <td>{appointment.petType}</td>
              <td>{appointment.service}</td>
              <td>{appointment.price}</td>
              <td>{appointment.vet}</td>
              <td>{appointment.date}</td>
              <td>{appointment.time}</td>
              <td>
                <div className="flex gap-3 justify-center">
                  <div
                    className="bg-red-100 text-red-600 p-2 rounded cursor-pointer"
                    onClick={() => handleDelete(appointment._id)}
                  >
                    <MdDelete />
                  </div>
                  <div
                    className="bg-green-100 text-green-600 p-2 rounded cursor-pointer"
                    onClick={() => handleUpdate(appointment)}
                  >
                    <FaPen />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AppointmentList;
