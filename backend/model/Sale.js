// models/sales.model.js
import mongoose from "mongoose";

const salesSchema = new mongoose.Schema({
  atendentID: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  transaction_no: { type: String, required: true },
  fuelType: { type: String, required: true },
  pumpNo: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  preRead: { type: Number, required: true },
  curRead: { type: Number, required: true },
  ltrSold: { type: Number, required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String },
  entry_method: { type: String },
  tax: { type: Number },
  sales_ref: { type: String },
  stationID: { type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true },
  created_at: { type: Date, default: Date.now },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" }
});

export default mongoose.model("Sale", salesSchema);
