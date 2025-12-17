// models/pumps.model.js
import mongoose from "mongoose";

const pumpSchema = new mongoose.Schema({
  pumpName: { type: String, required: true },
  stationID: { type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true },
  fuelID: { type: mongoose.Schema.Types.ObjectId, ref: "Fuel", required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: Number, default: 0 },
  MaintenanceDate: { type: Date },
  pumpDesc: { type: String }
});

export default mongoose.model("Pump", pumpSchema);
