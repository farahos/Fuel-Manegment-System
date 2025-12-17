// models/stations.model.js
import mongoose from "mongoose";

const stationSchema = new mongoose.Schema({
  Name: { type: String },
  Location: { type: String },
  ContactNumber: { type: String },
  status: { type: String, default: "0" }
});

export default mongoose.model("Station", stationSchema);
