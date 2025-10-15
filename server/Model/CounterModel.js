import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // prefix, e.g., 'APPT', 'MART'
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

const Counter = mongoose.model("Counter", CounterSchema);
export default Counter;