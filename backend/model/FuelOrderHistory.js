// models/fuel_order_history.model.js
import mongoose from "mongoose";

const fuelOrderHistorySchema = new mongoose.Schema({
  fuel_type: { type: String, required: true },
  quantity_liters: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total_cost: { type: Number },
  supplier_name: { type: String },
  received_by: { type: String },
  delivery_note: { type: String },
  date_received: { type: Date, default: Date.now },
  remarks: { type: String }
});

export default mongoose.model("FuelOrderHistory", fuelOrderHistorySchema);

