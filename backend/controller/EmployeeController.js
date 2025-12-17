import Employee from "../model/Employees.js";
import Station from "../model/Station.js";
import { createError } from "../utils/error.js";
import bcrypt from "bcryptjs";

// Create new employee
export const createEmployee = async (req, res, next) => {
  try {
    const { 
      Name, 
      Email, 
      UserName, 
      Password, 
      Role, 
      Sex, 
      ContactNumber, 
      StationID, 
      status 
    } = req.body;

    // Check if employee already exists with same email or username
    const existingEmployee = await Employee.findOne({
      $or: [{ Email }, { UserName }]
    });

    if (existingEmployee) {
      return next(createError(400, "Employee with this email or username already exists"));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    // Verify station exists if provided
    if (StationID) {
      const stationExists = await Station.findById(StationID);
      if (!stationExists) {
        return next(createError(404, "Station not found"));
      }
    }

    const newEmployee = new Employee({
      Name,
      Email,
      UserName,
      Password: hashedPassword,
      Role: Role || "employee",
      Sex,
      ContactNumber,
      StationID: StationID || null,
      status: status || 0
    });

    const savedEmployee = await newEmployee.save();
    
    // Remove password from response
    const { Password: _, ...employeeWithoutPassword } = savedEmployee.toObject();

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employeeWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// Get all employees
export const getEmployees = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      status, 
      role, 
      station 
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: "i" } },
        { Email: { $regex: search, $options: "i" } },
        { UserName: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by status
    if (status !== undefined) {
      query.status = parseInt(status);
    }

    // Filter by role
    if (role) {
      query.Role = role;
    }

    // Filter by station
    if (station) {
      query.StationID = station;
    }

    const employees = await Employee.find(query)
      .select("-Password") // Exclude password
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate("StationID", "name location"); // Populate station info

    const total = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single employee by ID
export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("-Password")
      .populate("StationID", "name location");

    if (!employee) {
      return next(createError(404, "Employee not found"));
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// Update employee
export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if employee exists
    const existingEmployee = await Employee.findById(id);
    if (!existingEmployee) {
      return next(createError(404, "Employee not found"));
    }

    // If updating email or username, check for duplicates
    if (updates.Email || updates.UserName) {
      const duplicateQuery = {
        $and: [{ _id: { $ne: id } }]
      };

      if (updates.Email) {
        duplicateQuery.$or = [{ Email: updates.Email }];
      }
      if (updates.UserName) {
        duplicateQuery.$or = duplicateQuery.$or || [];
        duplicateQuery.$or.push({ UserName: updates.UserName });
      }

      const duplicate = await Employee.findOne(duplicateQuery);
      if (duplicate) {
        return next(createError(400, "Email or username already exists"));
      }
    }

    // Hash password if updating
    if (updates.Password) {
      const salt = await bcrypt.genSalt(10);
      updates.Password = await bcrypt.hash(updates.Password, salt);
    }

    // Verify station exists if updating
    if (updates.StationID) {
      const stationExists = await Station.findById(updates.StationID);
      if (!stationExists) {
        return next(createError(404, "Station not found"));
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select("-Password");

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee
    });
  } catch (error) {
    next(error);
  }
};

// Delete employee
export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return next(createError(404, "Employee not found"));
    }

    // Prevent deleting admin users
    if (employee.Role === 'admin') {
      return next(createError(403, "Cannot delete admin users"));
    }

    await Employee.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Toggle employee status
export const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return next(createError(404, "Employee not found"));
    }

    employee.status = employee.status === 1 ? 0 : 1;
    employee.updatedAt = Date.now();
    await employee.save();

    // Remove password from response
    const { Password, ...employeeWithoutPassword } = employee.toObject();

    res.status(200).json({
      success: true,
      message: `Employee ${employee.status === 1 ? 'activated' : 'deactivated'} successfully`,
      data: employeeWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// Get employee statistics
export const getEmployeeStats = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 1 });
    const adminCount = await Employee.countDocuments({ Role: 'admin' });
    const stationManagers = await Employee.countDocuments({ Role: 'station_manager' });

    const roleDistribution = await Employee.aggregate([
      { $group: { _id: "$Role", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        adminCount,
        stationManagers,
        roleDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};