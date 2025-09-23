import React, { useState } from "react";

function AppointmentForm() {
  const today = new Date();
  const minDate = today.toISOString().split("T")[0]; // yyyy-mm-dd
  const minTime = today.toTimeString().slice(0, 5); // HH:mm

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  console.log('appointmentForm', appointmentForm);


  return (
    <div className="w-full px-5 min-h-[calc(100vh-60px)] flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-md space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center mb-4">
          Book Appointment
        </h2>

        {/* Owner Name */}
        <div>
          <label className="block text-gray-700 mb-1">Owner Name</label>
          <input
            type="text"
            name="ownerName"
            value={appointmentForm.ownerName}
            onChange={handleFormChange}
            placeholder="Enter owner name"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Pet Name */}
        <div>
          <label className="block text-gray-700 mb-1">Pet Name</label>
          <input
            type="text"
            name="petName"
            value={appointmentForm.petName}
            onChange={handleFormChange}
            placeholder="Enter pet name"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Pet Type */}
        <div>
          <label className="block text-gray-700 mb-1">Pet Type</label>
          <input
            type="text"
            name="petType"
            value={appointmentForm.petType}
            onChange={handleFormChange}
            placeholder="Dog, Cat, etc."
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Service */}
        <div>
          <label className="block text-gray-700 mb-1">Service</label>
          <input
            type="text"
            name="service"
            value={appointmentForm.service}
            onChange={handleFormChange}
            placeholder="e.g. Vaccination"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-gray-700 mb-1">Price</label>
          <input
            type="number"
            name="price"
            value={appointmentForm.price}
            onChange={handleFormChange}
            placeholder="Enter price"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Vet Dropdown */}
        <div>
          <label className="block text-gray-700 mb-1">Vet</label>
          <select
            name="vet"
            value={appointmentForm.vet}
            onChange={handleFormChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a vet</option>
            {vets.map((vet, index) => (
              <option key={index} value={vet}>
                {vet}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-gray-700 mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={appointmentForm.date}
            onChange={handleFormChange}
            min={minDate}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-gray-700 mb-1">Time</label>
          <input
            type="time"
            name="time"
            value={appointmentForm.time}
            onChange={handleFormChange}
            min={appointmentForm.date === minDate ? minTime : undefined}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default AppointmentForm;
