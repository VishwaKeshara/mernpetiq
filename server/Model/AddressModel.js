const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true, default: "guest" },
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  phone:     { type: String, required: true, trim: true }, 
  line1:     { type: String, required: true, trim: true },
  line2:     { type: String, trim: true, default: "" },
  city:      { type: String, required: true, trim: true },
  state:     { type: String, required: true, trim: true },
  postalCode:{ type: String, trim: true, default: "" },
  country:   { type: String, trim: true, default: "Sri Lanka" },
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);
