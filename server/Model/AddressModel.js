import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "guest", index: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: "Sri Lanka" },
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", AddressSchema);
export default Address;