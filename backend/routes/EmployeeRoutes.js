import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  getEmployeeStats
} from "../controller/EmployeeController.js"
import { authorizeRoles } from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes require authentication
//router.use(verifyToken);

// Employee routes
router.post("/",  createEmployee);
router.get("/", getEmployees);
router.get("/stats", getEmployeeStats);
router.get("/:id", getEmployeeById);
router.put("/:id",  updateEmployee);
router.delete("/:id",  deleteEmployee);
router.patch("/:id/toggle-status",  toggleEmployeeStatus);

export default router;