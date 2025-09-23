import React, { useState } from "react";
import { appointmentBaseURL } from "../../axiosinstance";

function AppointmentAdd() {
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

  const handleSubmit = async (e) => {
    try {
      if(!appointmentForm?.ownerName ||
      !appointmentForm.petName ||
      !appointmentForm.petType || 
      !appointmentForm.service ||
      !appointmentForm.price ||
      !appointmentForm.vet ||
      !appointmentForm.date ||
      !appointmentForm.time ){
        alert("All fields are required");
      }
      const {data} = await appointmentBaseURL.post("/addappointment", appointmentForm);
      if(data?.success ){
        alert(data?.message);
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
      console.log(data);  
    }catch (error) {
      console.error(error);
    }

    console.log("appointmentForm", appointmentForm);
  };

  return (
    <div className="w-full px-5 min-h-[calc(100vh-60px)]">
      <div className="w-full grid grid-cols-5 gap-3 my-4">
        {/* Owner Name */}
        <div className="w-full flex flex-col gap-2">
          <label htmlFor="ownerName">Owner Name</label>
          <input
            id="ownerName"
            type="text"
            placeholder="Enter owner name"
            className="w-full border-2 border-gray-300 text-gray-800 rounded-sm outline-none h-8 px-2"
            name="ownerName"
            value={appointmentForm.ownerName}
            onChange={handleFormChange}
          />
        </div>

        {/* Pet Name */}
        <div>
          <label htmlFor="petName">Pet Name</label>
          <input
            id="petName"
            type="text"
            name="petName"
            value={appointmentForm.petName}
            onChange={handleFormChange}
            placeholder="Enter pet name"
            className="w-full border-2 border-gray-300 text-gray-800 rounded-sm outline-none h-8 px-2"
          />
        </div>

        {/* Pet Type */}
        <div>
          <label htmlFor="petType">Pet Type</label>
          <input
            id="petType"
            type="text"
            name="petType"
            value={appointmentForm.petType}
            onChange={handleFormChange}
            placeholder="Dog, Cat, etc."
            className="w-full border-2 border-gray-300 text-gray-800 rounded-sm outline-none h-8 px-2"
          />
        </div>

        {/* Service */}
        <div>
          <label htmlFor="service">Service</label>
          <input
            id="service"
            type="text"
            name="service"
            value={appointmentForm.service}
            onChange={handleFormChange}
            placeholder="e.g. Vaccination"
            className="w-full border-2 border-gray-300 text-gray-800 rounded-sm outline-none h-8 px-2"
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price">Price</label>
          <input
            id="price"
            type="number"
            name="price"
            value={appointmentForm.price}
            onChange={handleFormChange}
            placeholder="Enter price"
            className="w-full border-2 border-gray-300 text-gray-800 rounded-sm outline-none h-8 px-2"
          />
        </div>

        {/* Vet Dropdown */}
        <div>
          <label htmlFor="vet">Vet</label>
          <select
            id="vet"
            name="vet"
            title="Select Vet"
            value={appointmentForm.vet}
            onChange={handleFormChange}
            className="w-full border-2 border-gray-300 text-gray-800 rounded-sm outline-none h-8 px-2"
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
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            name="date"
            title="Select Date"
            placeholder="Select date"
            value={appointmentForm.date}
            onChange={handleFormChange}
            min={minDate}
            className="w-full border-2 border-gray-300 text-gray-800 rounded-sm outline-none h-8 px-2"
          />
        </div>

        {/* Time */}
        <div>
          <label htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            placeholder="Select time"
            name="time"
            value={appointmentForm.time}
            onChange={handleFormChange}
            min={appointmentForm.date === minDate ? minTime : undefined}
            className="w-full border-2 border-gray-300 text-gray-800 rounded-sm outline-none h-8 px-2"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-gray-700 text-white h-9 w-22 rounded-md cursor-pointer"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default AppointmentAdd;
