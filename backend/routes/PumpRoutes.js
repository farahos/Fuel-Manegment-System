import express from "express";
import {
  createPump,
  getPumps,
  getPumpById,
  updatePump,
  deletePump,
  togglePumpStatus,
  getPumpsByStation,
  getPumpsByFuel,
  getMaintenanceDuePumps,
  getPumpStats
} from "../controller/PumpController.js";
import {  authorizeRoles } from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes require authentication
//router.use(verifyToken);

// Pump routes
router.post("/", authorizeRoles('admin', 'station_manager'), createPump);
router.get("/", getPumps);
router.get("/stats", getPumpStats);
router.get("/maintenance-due", getMaintenanceDuePumps);
router.get("/station/:stationID", getPumpsByStation);
router.get("/fuel/:fuelID", getPumpsByFuel);
router.get("/:id", getPumpById);
router.put("/:id", authorizeRoles('admin', 'station_manager'), updatePump);
router.delete("/:id", authorizeRoles('admin'), deletePump);
router.patch("/:id/toggle-status", authorizeRoles('admin', 'station_manager'), togglePumpStatus);

export default router;