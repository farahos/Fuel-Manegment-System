// models/employees.model.js
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Email: { type: String, required: true },
  UserName: { type: String },
  Password: { type: String, required: true },
  Role: { type: String },
  Sex: { type: String },
  ContactNumber: { type: Number },
  StationID: { type: mongoose.Schema.Types.ObjectId, ref: "Station" },
status: { type: Number, default: 0 },
 
});

export default mongoose.model("Employee", employeeSchema);
