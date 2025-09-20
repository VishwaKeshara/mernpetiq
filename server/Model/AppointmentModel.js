const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({

  ownerName: { type: String, required: true },
  petName: { type: String, required: true },
  petType: { type: String, required: true },
  service: { type: String, required: true },
  price: { type: Number, required: true },
  vet: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
});

module.exports = mongoose.model("Appointment", appointmentSchema);