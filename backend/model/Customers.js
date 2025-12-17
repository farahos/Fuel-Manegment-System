// models/customers.model.js
import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  opening_balance: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  status: { type: Number, default: 0 },
});

export default mongoose.model("Customer", customerSchema);
