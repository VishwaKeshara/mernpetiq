const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  pmId: { type: String, unique: true, index: true },
  brand: String,
  last4: String,
  exp_month: Number,
  exp_year: Number,
  billing_name: String,
  stripe_customer: String,
}, { timestamps: true });

const txSchema = new mongoose.Schema({
  piId: { type: String, unique: true, index: true },
  amount: Number,       
  currency: String,     
  status: String,       
  source: String,       
  ref_id: String,       
  description: String,  
}, { timestamps: true });

module.exports = mongoose.model("Card", cardSchema);
module.exports.Tx = mongoose.model("Tx", txSchema);
