import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function AppointmentDetails() {
  const { id } = useParams(); // appointment ID from route
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);

  // Fetch appointment by ID
  useEffect(() => {
    fetch(`http://localhost:8000/appointments/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch appointment");
        }
        return res.json();
      })
      .then((data) => setAppointment(data))
      .catch((err) => console.error("Error:", err));
  }, [id]);

  if (!appointment) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Loading appointment...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-3xl">
        <h2 className="text-2xl font-semibold mb-6 text-center text-blue-600">
          Appointment Details
        </h2>

        <div className="overflow-x-auto">
          <table className="table-auto w-full border border-gray-300 rounded-lg">
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold text-gray-700 w-1/3">Owner</td>
                <td className="px-4 py-2">{appointment.ownerName}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold text-gray-700">Pet Name</td>
                <td className="px-4 py-2">{appointment.petName}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold text-gray-700">Pet Type</td>
                <td className="px-4 py-2">{appointment.petType}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold text-gray-700">Service</td>
                <td className="px-4 py-2">{appointment.service}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold text-gray-700">Price</td>
                <td className="px-4 py-2">Rs. {appointment.price}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold text-gray-700">Vet</td>
                <td className="px-4 py-2">{appointment.vet}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold text-gray-700">Date</td>
                <td className="px-4 py-2">{appointment.date}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700">Time</td>
                <td className="px-4 py-2">{appointment.time}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Back
          </button>
          <button
            onClick={() => navigate(`/appointments/edit/${appointment._id}`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
          >
            Update
          </button>
          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to delete this appointment?")) {
                await fetch(`http://localhost:8000/appointments/${appointment._id}`, {
                  method: "DELETE",
                });
                navigate("/appointments");
              }
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetails;
