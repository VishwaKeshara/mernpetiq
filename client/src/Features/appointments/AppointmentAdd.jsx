import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appointmentBaseURL } from "../../axiosinstance";

function AppointmentAdd() {
  const location = useLocation();
  const navigate = useNavigate();

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const minTime = today.toTimeString().slice(0, 5);

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

  const [isUpdating, setIsUpdating] = useState(false);

  // Pre-fill form if appointment object passed via navigation state
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Check required fields
      const fields = Object.values(appointmentForm);
      if (fields.some((f) => !f)) {
        alert("All fields are required!");
        return;
      }

      if (isUpdating) {
        const { data } = await appointmentBaseURL.post("/updateAppointment", appointmentForm);
        if (data?.success) {
          alert(data.message);
          navigate("/appointmentList");
        }
      } else {
        const { data } = await appointmentBaseURL.post("/addappointment", appointmentForm);
        if (data?.success) {
          alert(data.message);
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
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-full px-5 min-h-[calc(100vh-60px)]">
      <h2 className="text-2xl font-semibold my-4">
        {isUpdating ? "Update Appointment" : "Add Appointment"}
      </h2>
      <div className="grid grid-cols-5 gap-3 my-4">
        {/* Owner Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="ownerName">Owner Name</label>
          <input
            type="text"
            id="ownerName"
            name="ownerName"
            placeholder="Enter owner name"
            value={appointmentForm.ownerName}
            onChange={handleFormChange}
            className="border-2 border-gray-300 rounded-sm h-8 px-2 outline-none"
          />
        </div>

        {/* Pet Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="petName">Pet Name</label>
          <input
            type="text"
            id="petName"
            name="petName"
            placeholder="Enter pet name"
            value={appointmentForm.petName}
            onChange={handleFormChange}
            className="border-2 border-gray-300 rounded-sm h-8 px-2 outline-none"
          />
        </div>

        {/* Pet Type */}
        <div className="flex flex-col gap-2">
          <label htmlFor="petType">Pet Type</label>
          <input
            type="text"
            id="petType"
            name="petType"
            placeholder="Dog, Cat, etc."
            value={appointmentForm.petType}
            onChange={handleFormChange}
            className="border-2 border-gray-300 rounded-sm h-8 px-2 outline-none"
          />
        </div>

        {/* Service */}
        <div className="flex flex-col gap-2">
          <label htmlFor="service">Service</label>
          <input
            type="text"
            id="service"
            name="service"
            placeholder="e.g. Vaccination"
            value={appointmentForm.service}
            onChange={handleFormChange}
            className="border-2 border-gray-300 rounded-sm h-8 px-2 outline-none"
          />
        </div>

        {/* Price */}
        <div className="flex flex-col gap-2">
          <label htmlFor="price">Price</label>
          <input
            type="number"
            id="price"
            name="price"
            placeholder="Enter price"
            value={appointmentForm.price}
            onChange={handleFormChange}
            className="border-2 border-gray-300 rounded-sm h-8 px-2 outline-none"
          />
        </div>

        {/* Vet */}
        <div className="flex flex-col gap-2">
          <label htmlFor="vet">Vet</label>
          <select
            id="vet"
            name="vet"
            value={appointmentForm.vet}
            onChange={handleFormChange}
            className="border-2 border-gray-300 rounded-sm h-8 px-2 outline-none"
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
        <div className="flex flex-col gap-2">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={appointmentForm.date}
            onChange={handleFormChange}
            min={minDate}
            className="border-2 border-gray-300 rounded-sm h-8 px-2 outline-none"
          />
        </div>

        {/* Time */}
        <div className="flex flex-col gap-2">
          <label htmlFor="time">Time</label>
          <input
            type="time"
            id="time"
            name="time"
            value={appointmentForm.time}
            onChange={handleFormChange}
            min={appointmentForm.date === minDate ? minTime : undefined}
            className="border-2 border-gray-300 rounded-sm h-8 px-2 outline-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            className="bg-gray-700 text-white h-9 px-4 rounded-md cursor-pointer"
          >
            {isUpdating ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentAdd;
