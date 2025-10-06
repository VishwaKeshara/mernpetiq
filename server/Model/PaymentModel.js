import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  pmId: { type: String, unique: true, index: true }, // Stripe PaymentMethod ID
  brand: String,
  last4: String,
  exp_month: Number,
  exp_year: Number,
  billing_name: String,
  stripe_customer: { type: String, index: true }, // Stripe customer ID
  metadata: { type: Object }, // optional: store extra Stripe data
}, { timestamps: true });

const txSchema = new mongoose.Schema({
  piId: { type: String, unique: true, index: true }, // Stripe PaymentIntent ID
  amount: Number,
  currency: String,
  status: String,
  source: String,  // "hospital" / "mart"
  ref_id: String,  // appointmentId / orderId
  description: String,
  stripe_customer: { type: String, index: true }, // customer related to transaction
  payment_method: String, // Stripe payment method used
  metadata: { type: Object }, // store any extra Stripe metadata
}, { timestamps: true });

export const Card = mongoose.model("Card", cardSchema);
export const Tx = mongoose.model("Tx", txSchema);
