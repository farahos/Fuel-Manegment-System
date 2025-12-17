// models/fuels.model.js
import mongoose from "mongoose";

const fuelSchema = new mongoose.Schema({
  FuelType: { type: String, required: true },
  UnitPrice: { type: Number, required: true },
  AvailableLiters: { type: Number },
  Supplier: { type: String, required: true },
  Status: { type: Number, default: 0 },
  Date: { type: Date, default: Date.now }
});

export default mongoose.model("Fuel", fuelSchema);