import mongoose from "mongoose";

const TxSchema = new mongoose.Schema({
  piId: String,
  amount: Number,
  currency: String,
  status: String,
  source: String,
  ref_id: String,
  description: String,
  stripe_customer: String,
  payment_method: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Prevent OverwriteModelError in development/hot-reload:
const Tx = mongoose.models.Tx || mongoose.model("Tx", TxSchema);

export default Tx;