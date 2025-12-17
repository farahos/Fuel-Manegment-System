import express from "express";
import {
  createFuel,
  getFuels,
  getFuelById,
  updateFuel,
  deleteFuel,
  toggleFuelStatus,
  updateFuelStock,
  getFuelStats,
  getLowStockFuels
} from "../controller/FuelController.js"
import { authorizeRoles } from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes require authentication
//router.use(verifyToken);

// Fuel routes
router.post("/",  createFuel);
router.get("/", getFuels);
router.get("/stats", getFuelStats);
router.get("/low-stock", getLowStockFuels);
router.get("/:id", getFuelById);
router.put("/:id", authorizeRoles('admin', 'station_manager'), updateFuel);
router.delete("/:id", authorizeRoles('admin'), deleteFuel);
router.patch("/:id/toggle-status", authorizeRoles('admin', 'station_manager'), toggleFuelStatus);
router.patch("/:id/stock", authorizeRoles('admin', 'station_manager'), updateFuelStock);

export default router;