import Pump from "../model/Pump.js"
import Station from "../model/Station.js";
import Fuel from "../model/Fuel.js";
import { createError } from "../utils/error.js";

// Create new pump
export const createPump = async (req, res, next) => {
  try {
    const { 
      pumpName, 
      stationID, 
      fuelID, 
      status, 
      MaintenanceDate, 
      pumpDesc 
    } = req.body;

    // Validate station exists
    const station = await Station.findById(stationID);
    if (!station) {
      return next(createError(404, "Station not found"));
    }

    // Validate fuel exists
    const fuel = await Fuel.findById(fuelID);
    if (!fuel) {
      return next(createError(404, "Fuel type not found"));
    }

    // Check if pump name already exists in this station
    const existingPump = await Pump.findOne({ 
      pumpName: { $regex: new RegExp(`^${pumpName}$`, 'i') },
      stationID 
    });

    if (existingPump) {
      return next(createError(400, "Pump with this name already exists in this station"));
    }

    const newPump = new Pump({
      pumpName,
      stationID,
      fuelID,
      status: status || 0,
      MaintenanceDate: MaintenanceDate ? new Date(MaintenanceDate) : null,
      pumpDesc
    });

    const savedPump = await newPump.save();
    
    // Populate references for response
    const populatedPump = await Pump.findById(savedPump._id)
      .populate('stationID', 'name location')
      .populate('fuelID', 'FuelType UnitPrice AvailableLiters');

    res.status(201).json({
      success: true,
      message: "Pump created successfully",
      data: populatedPump
    });
  } catch (error) {
    next(error);
  }
};

// Get all pumps
export const getPumps = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      status, 
      stationID,
      fuelID,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { pumpName: { $regex: search, $options: "i" } },
        { pumpDesc: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by status
    if (status !== undefined) {
      query.status = parseInt(status);
    }

    // Filter by station
    if (stationID) {
      query.stationID = stationID;
    }

    // Filter by fuel type
    if (fuelID) {
      query.fuelID = fuelID;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const pumps = await Pump.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions)
      .populate('stationID', 'name location')
      .populate('fuelID', 'FuelType UnitPrice AvailableLiters');

    const total = await Pump.countDocuments(query);

    // Get statistics
    const stats = await Pump.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const activePumps = stats.find(s => s._id === 1)?.count || 0;
    const inactivePumps = stats.find(s => s._id === 0)?.count || 0;

    // Get fuel distribution
    const fuelDistribution = await Pump.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$fuelID",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "fuels",
          localField: "_id",
          foreignField: "_id",
          as: "fuelInfo"
        }
      },
      { $unwind: "$fuelInfo" },
      {
        $project: {
          fuelType: "$fuelInfo.FuelType",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: pumps,
      statistics: {
        totalPumps: total,
        activePumps,
        inactivePumps,
        fuelDistribution
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

// Get single pump by ID
export const getPumpById = async (req, res, next) => {
  try {
    const pump = await Pump.findById(req.params.id)
      .populate('stationID', 'name location address')
      .populate('fuelID', 'FuelType UnitPrice AvailableLiters Supplier');

    if (!pump) {
      return next(createError(404, "Pump not found"));
    }

    res.status(200).json({
      success: true,
      data: pump
    });
  } catch (error) {
    next(error);
  }
};

// Update pump
export const updatePump = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if pump exists
    const existingPump = await Pump.findById(id);
    if (!existingPump) {
      return next(createError(404, "Pump not found"));
    }

    // Validate station if being updated
    if (updates.stationID) {
      const station = await Station.findById(updates.stationID);
      if (!station) {
        return next(createError(404, "Station not found"));
      }
    }

    // Validate fuel if being updated
    if (updates.fuelID) {
      const fuel = await Fuel.findById(updates.fuelID);
      if (!fuel) {
        return next(createError(404, "Fuel type not found"));
      }
    }

    // Check for duplicate pump name in same station
    if (updates.pumpName) {
      const stationToCheck = updates.stationID || existingPump.stationID;
      const duplicate = await Pump.findOne({
        pumpName: { $regex: new RegExp(`^${updates.pumpName}$`, 'i') },
        stationID: stationToCheck,
        _id: { $ne: id }
      });

      if (duplicate) {
        return next(createError(400, "Pump with this name already exists in this station"));
      }
    }

    // Format MaintenanceDate
    if (updates.MaintenanceDate) {
      updates.MaintenanceDate = new Date(updates.MaintenanceDate);
    }

    const updatedPump = await Pump.findByIdAndUpdate(
      id,
      { ...updates },
      { new: true, runValidators: true }
    )
    .populate('stationID', 'name location')
    .populate('fuelID', 'FuelType UnitPrice AvailableLiters');

    res.status(200).json({
      success: true,
      message: "Pump updated successfully",
      data: updatedPump
    });
  } catch (error) {
    next(error);
  }
};

// Delete pump
export const deletePump = async (req, res, next) => {
  try {
    const pump = await Pump.findById(req.params.id);
    
    if (!pump) {
      return next(createError(404, "Pump not found"));
    }

    // Check if pump is active
    if (pump.status === 1) {
      return next(createError(400, "Cannot delete active pump. Deactivate it first."));
    }

    await Pump.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Pump deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Toggle pump status
export const togglePumpStatus = async (req, res, next) => {
  try {
    const pump = await Pump.findById(req.params.id);
    
    if (!pump) {
      return next(createError(404, "Pump not found"));
    }

    pump.status = pump.status === 1 ? 0 : 1;
    await pump.save();

    const populatedPump = await Pump.findById(pump._id)
      .populate('stationID', 'name location')
      .populate('fuelID', 'FuelType UnitPrice AvailableLiters');

    res.status(200).json({
      success: true,
      message: `Pump ${pump.status === 1 ? 'activated' : 'deactivated'} successfully`,
      data: populatedPump
    });
  } catch (error) {
    next(error);
  }
};

// Get pumps by station
export const getPumpsByStation = async (req, res, next) => {
  try {
    const { stationID } = req.params;
    const { status } = req.query;

    let query = { stationID };

    if (status !== undefined) {
      query.status = parseInt(status);
    }

    const pumps = await Pump.find(query)
      .populate('fuelID', 'FuelType UnitPrice AvailableLiters')
      .sort({ pumpName: 1 });

    const station = await Station.findById(stationID).select('name location');

    res.status(200).json({
      success: true,
      data: pumps,
      station
    });
  } catch (error) {
    next(error);
  }
};

// Get pumps by fuel type
export const getPumpsByFuel = async (req, res, next) => {
  try {
    const { fuelID } = req.params;

    const pumps = await Pump.find({ fuelID })
      .populate('stationID', 'name location')
      .populate('fuelID', 'FuelType UnitPrice')
      .sort({ stationID: 1, pumpName: 1 });

    const fuel = await Fuel.findById(fuelID).select('FuelType UnitPrice');

    res.status(200).json({
      success: true,
      data: pumps,
      fuel
    });
  } catch (error) {
    next(error);
  }
};

// Get maintenance due pumps
export const getMaintenanceDuePumps = async (req, res, next) => {
  try {
    const { days = 7 } = req.query; // Days before maintenance is due
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days));

    const pumps = await Pump.find({
      MaintenanceDate: { $lte: dueDate },
      status: 1 // Only active pumps
    })
    .populate('stationID', 'name location')
    .populate('fuelID', 'FuelType')
    .sort({ MaintenanceDate: 1 });

    res.status(200).json({
      success: true,
      data: pumps,
      dueDate: dueDate.toISOString().split('T')[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get pump statistics
export const getPumpStats = async (req, res, next) => {
  try {
    // Total pumps by status
    const statusStats = await Pump.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Pumps by station
    const stationStats = await Pump.aggregate([
      {
        $group: {
          _id: "$stationID",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "stations",
          localField: "_id",
          foreignField: "_id",
          as: "stationInfo"
        }
      },
      { $unwind: "$stationInfo" },
      {
        $project: {
          stationName: "$stationInfo.name",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Pumps by fuel type
    const fuelStats = await Pump.aggregate([
      {
        $group: {
          _id: "$fuelID",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "fuels",
          localField: "_id",
          foreignField: "_id",
          as: "fuelInfo"
        }
      },
      { $unwind: "$fuelInfo" },
      {
        $project: {
          fuelType: "$fuelInfo.FuelType",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Monthly pump creation
    const monthlyStats = await Pump.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusStats,
        stationStats,
        fuelStats,
        monthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
};