import express from "express";
import {
  createFuelOrder,
  getFuelOrders,
  getFuelOrderById,
  updateFuelOrder,
  deleteFuelOrder,
  getOrderSummary,
  exportOrdersToCSV,
  getRecentOrders
} from "../controllers/fuelOrderHistory.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Fuel Order History routes
router.post("/", authorizeRoles('admin', 'station_manager'), createFuelOrder);
router.get("/", getFuelOrders);
router.get("/recent", getRecentOrders);
router.get("/summary", getOrderSummary);
router.get("/export", exportOrdersToCSV);
router.get("/:id", getFuelOrderById);
router.put("/:id", authorizeRoles('admin', 'station_manager'), updateFuelOrder);
router.delete("/:id", authorizeRoles('admin'), deleteFuelOrder);

export default router;