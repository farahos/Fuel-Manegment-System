import express from "express";
import {
  createStation,
  getStations,
  getStationById,
  updateStation,
  deleteStation,
  toggleStationStatus,
  getStationStats,
  getStationPerformance,
  assignStationManager,
  getStationInventory,
  exportStationsToCSV
} from "../controller/StationController.js";
import {  authorizeRoles } from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes require authentication
//router.use(verifyToken);

// Station routes
router.post("/",  createStation);
router.get("/", getStations);
router.get("/stats", getStationStats);
router.get("/performance", getStationPerformance);
router.get("/export", exportStationsToCSV);
router.get("/:id", getStationById);
router.get("/:stationId/inventory", getStationInventory);
router.put("/:id",  updateStation);
router.delete("/:id", authorizeRoles('admin'), deleteStation);
router.patch("/:id/toggle-status", authorizeRoles('admin', 'station_manager'), toggleStationStatus);
router.patch("/:stationId/assign-manager/:employeeId", authorizeRoles('admin'), assignStationManager);

export default router;