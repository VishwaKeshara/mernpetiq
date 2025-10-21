import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // Counter ID (e.g., "APPT", "MART")
  seq: { type: Number, default: 1 }       // Current sequence number
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export default Counter;