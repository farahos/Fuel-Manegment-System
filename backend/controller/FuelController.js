import Fuel from "../model/Fuel.js";
import { createError } from "../utils/error.js";

// Create new fuel
export const createFuel = async (req, res, next) => {
  try {
    const { 
      FuelType, 
      UnitPrice, 
      AvailableLiters, 
      Supplier, 
      Status 
    } = req.body;

    // Check if fuel type already exists
    const existingFuel = await Fuel.findOne({ 
      FuelType: { $regex: new RegExp(`^${FuelType}$`, 'i') }
    });

    if (existingFuel) {
      return next(createError(400, "Fuel type already exists"));
    }

    // Validate unit price
    if (UnitPrice <= 0) {
      return next(createError(400, "Unit price must be greater than 0"));
    }

    const newFuel = new Fuel({
      FuelType,
      UnitPrice,
      AvailableLiters: AvailableLiters || 0,
      Supplier,
      Status: Status || 0
    });

    const savedFuel = await newFuel.save();
    
    res.status(201).json({
      success: true,
      message: "Fuel created successfully",
      data: savedFuel
    });
  } catch (error) {
    next(error);
  }
};

// Get all fuels
export const getFuels = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      status, 
      supplier,
      sortBy = "Date",
      sortOrder = "desc"
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { FuelType: { $regex: search, $options: "i" } },
        { Supplier: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by status
    if (status !== undefined) {
      query.Status = parseInt(status);
    }

    // Filter by supplier
    if (supplier) {
      query.Supplier = { $regex: supplier, $options: "i" };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const fuels = await Fuel.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);

    const total = await Fuel.countDocuments(query);

    // Calculate total value of available fuel
    const totalValueAggregation = await Fuel.aggregate([
      { $match: query },
      { 
        $group: {
          _id: null,
          totalLiters: { $sum: "$AvailableLiters" },
          totalValue: { $sum: { $multiply: ["$AvailableLiters", "$UnitPrice"] } }
        }
      }
    ]);

    const stats = totalValueAggregation[0] || { totalLiters: 0, totalValue: 0 };

    res.status(200).json({
      success: true,
      data: fuels,
      stats: {
        totalLiters: stats.totalLiters,
        totalValue: stats.totalValue
      },
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

// Get single fuel by ID
export const getFuelById = async (req, res, next) => {
  try {
    const fuel = await Fuel.findById(req.params.id);

    if (!fuel) {
      return next(createError(404, "Fuel not found"));
    }

    res.status(200).json({
      success: true,
      data: fuel
    });
  } catch (error) {
    next(error);
  }
};

// Update fuel
export const updateFuel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if fuel exists
    const existingFuel = await Fuel.findById(id);
    if (!existingFuel) {
      return next(createError(404, "Fuel not found"));
    }

    // If updating fuel type, check for duplicates
    if (updates.FuelType) {
      const duplicate = await Fuel.findOne({
        FuelType: { $regex: new RegExp(`^${updates.FuelType}$`, 'i') },
        _id: { $ne: id }
      });

      if (duplicate) {
        return next(createError(400, "Fuel type already exists"));
      }
    }

    // Validate unit price
    if (updates.UnitPrice && updates.UnitPrice <= 0) {
      return next(createError(400, "Unit price must be greater than 0"));
    }

    const updatedFuel = await Fuel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Fuel updated successfully",
      data: updatedFuel
    });
  } catch (error) {
    next(error);
  }
};

// Delete fuel
export const deleteFuel = async (req, res, next) => {
  try {
    const fuel = await Fuel.findById(req.params.id);
    
    if (!fuel) {
      return next(createError(404, "Fuel not found"));
    }

    // Check if fuel has available liters
    if (fuel.AvailableLiters > 0) {
      return next(createError(400, "Cannot delete fuel with available stock"));
    }

    await Fuel.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Fuel deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Toggle fuel status
export const toggleFuelStatus = async (req, res, next) => {
  try {
    const fuel = await Fuel.findById(req.params.id);
    
    if (!fuel) {
      return next(createError(404, "Fuel not found"));
    }

    fuel.Status = fuel.Status === 1 ? 0 : 1;
    await fuel.save();

    res.status(200).json({
      success: true,
      message: `Fuel ${fuel.Status === 1 ? 'activated' : 'deactivated'} successfully`,
      data: fuel
    });
  } catch (error) {
    next(error);
  }
};

// Update fuel stock
export const updateFuelStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { operation, liters, price } = req.body; // operation: 'add' or 'reduce'

    const fuel = await Fuel.findById(id);
    if (!fuel) {
      return next(createError(404, "Fuel not found"));
    }

    if (!['add', 'reduce'].includes(operation)) {
      return next(createError(400, "Operation must be 'add' or 'reduce'"));
    }

    if (liters <= 0) {
      return next(createError(400, "Liters must be greater than 0"));
    }

    if (operation === 'reduce' && liters > fuel.AvailableLiters) {
      return next(createError(400, "Insufficient fuel stock"));
    }

    // Update available liters
    if (operation === 'add') {
      fuel.AvailableLiters += liters;
      // If price is provided, update unit price
      if (price && price > 0) {
        fuel.UnitPrice = price;
      }
    } else {
      fuel.AvailableLiters -= liters;
    }

    await fuel.save();

    res.status(200).json({
      success: true,
      message: `Fuel stock ${operation === 'add' ? 'increased' : 'decreased'} successfully`,
      data: fuel
    });
  } catch (error) {
    next(error);
  }
};

// Get fuel statistics
export const getFuelStats = async (req, res, next) => {
  try {
    const stats = await Fuel.aggregate([
      {
        $group: {
          _id: "$Status",
          count: { $sum: 1 },
          totalLiters: { $sum: "$AvailableLiters" },
          totalValue: { 
            $sum: { $multiply: ["$AvailableLiters", "$UnitPrice"] }
          }
        }
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          totalLiters: 1,
          totalValue: 1,
          _id: 0
        }
      }
    ]);

    // Get fuel types count
    const fuelTypes = await Fuel.aggregate([
      {
        $group: {
          _id: "$FuelType",
          count: { $sum: 1 },
          avgPrice: { $avg: "$UnitPrice" },
          totalLiters: { $sum: "$AvailableLiters" }
        }
      },
      {
        $project: {
          fuelType: "$_id",
          count: 1,
          avgPrice: 1,
          totalLiters: 1,
          _id: 0
        }
      },
      { $sort: { totalLiters: -1 } }
    ]);

    // Get suppliers distribution
    const suppliers = await Fuel.aggregate([
      {
        $group: {
          _id: "$Supplier",
          count: { $sum: 1 },
          fuelTypes: { $addToSet: "$FuelType" }
        }
      },
      {
        $project: {
          supplier: "$_id",
          count: 1,
          fuelTypes: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusStats: stats,
        fuelTypes,
        suppliers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get low stock fuels
export const getLowStockFuels = async (req, res, next) => {
  try {
    const { threshold = 1000 } = req.query;

    const lowStockFuels = await Fuel.find({
      AvailableLiters: { $lt: parseInt(threshold) },
      Status: 1
    }).sort({ AvailableLiters: 1 });

    res.status(200).json({
      success: true,
      data: lowStockFuels
    });
  } catch (error) {
    next(error);
  }
};