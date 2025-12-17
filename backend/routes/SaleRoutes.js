import express from "express";
import {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
  getSalesByStation,
  getSalesByCustomer,
  getTodaysSales,
  getSalesReport,
  exportSalesToCSV
} from "../controller/SalesController.js"
//import { verifyToken, authorizeRoles } from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes require authentication
//router.use(verifyToken);

// Sales routes
router.post("/",  createSale);
router.get("/", getSales);
router.get("/today", getTodaysSales);
router.get("/report", getSalesReport);
router.get("/export", exportSalesToCSV);
router.get("/station/:stationID", getSalesByStation);
router.get("/customer/:customerID", getSalesByCustomer);
router.get("/:id", getSaleById);
router.put("/:id", updateSale);
router.delete("/:id",  deleteSale);

export default router;