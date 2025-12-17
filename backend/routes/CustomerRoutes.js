import express from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus
} from "../controller/CustomerController.js"
//import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
//router.use(verifyToken);

// Customer routes
router.post("/", createCustomer); // Create new customer
router.get("/", getCustomers); // Get all customers with pagination
router.get("/:id", getCustomerById); // Get single customer
router.put("/:id", updateCustomer); // Update customer
router.delete("/:id", deleteCustomer); // Delete customer
router.patch("/:id/toggle-status", toggleCustomerStatus); // Toggle status

export default router;