import Station from "../model/Station.js";
import Employee from "../model/Employees.js";
import Pump from "../model/Pump.js";
import Sale from "../model/Sale.js";
import Fuel from "../model/Fuel.js";
import { createError } from "../utils/error.js";

// Create new station
export const createStation = async (req, res, next) => {
  try {
    const { 
      Name, 
      Location, 
      ContactNumber, 
      status 
    } = req.body;

    // Check if station already exists with same name in same location
    const existingStation = await Station.findOne({ 
      Name: { $regex: new RegExp(`^${Name}$`, 'i') },
      Location: { $regex: new RegExp(`^${Location}$`, 'i') }
    });

    if (existingStation) {
      return next(createError(400, "Station with this name already exists in this location"));
    }

    const newStation = new Station({
      Name,
      Location,
      ContactNumber,
      status: status || "0"
    });

    const savedStation = await newStation.save();
    
    res.status(201).json({
      success: true,
      message: "Station created successfully",
      data: savedStation
    });
  } catch (error) {
    next(error);
  }
};

// Get all stations
export const getStations = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      status,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: "i" } },
        { Location: { $regex: search, $options: "i" } },
        { ContactNumber: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by status
    if (status !== undefined) {
      query.status = status;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const stations = await Station.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);

    const total = await Station.countDocuments(query);

    // Get station statistics
    const stationIds = stations.map(station => station._id);
    
    // Get employee count per station
    const employeeCounts = await Employee.aggregate([
      { $match: { StationID: { $in: stationIds } } },
      { $group: { _id: "$StationID", count: { $sum: 1 } } }
    ]);

    // Get pump count per station
    const pumpCounts = await Pump.aggregate([
      { $match: { stationID: { $in: stationIds } } },
      { $group: { _id: "$stationID", count: { $sum: 1 } } }
    ]);

    // Get today's sales per station
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const salesStats = await Sale.aggregate([
      { 
        $match: { 
          stationID: { $in: stationIds },
          created_at: { $gte: today, $lt: tomorrow }
        } 
      },
      { 
        $group: { 
          _id: "$stationID",
          salesCount: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalLiters: { $sum: "$ltrSold" }
        } 
      }
    ]);

    // Add statistics to stations
    const stationsWithStats = stations.map(station => {
      const employeeCount = employeeCounts.find(e => e._id?.toString() === station._id.toString())?.count || 0;
      const pumpCount = pumpCounts.find(p => p._id?.toString() === station._id.toString())?.count || 0;
      const salesStat = salesStats.find(s => s._id?.toString() === station._id.toString()) || { 
        salesCount: 0, 
        totalAmount: 0, 
        totalLiters: 0 
      };

      return {
        ...station.toObject(),
        employeeCount,
        pumpCount,
        todaySales: salesStat.salesCount,
        todayRevenue: salesStat.totalAmount,
        todayLiters: salesStat.totalLiters
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalStations: total,
      activeStations: await Station.countDocuments({ status: "1" }),
      totalEmployees: await Employee.countDocuments({ StationID: { $in: stationIds } }),
      totalPumps: await Pump.countDocuments({ stationID: { $in: stationIds } })
    };

    res.status(200).json({
      success: true,
      data: stationsWithStats,
      statistics: overallStats,
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

// Get single station by ID
export const getStationById = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return next(createError(404, "Station not found"));
    }

    // Get station details with statistics
    const stationId = station._id;
    
    // Get employees at this station
    const employees = await Employee.find({ StationID: stationId })
      .select('Name Email Role ContactNumber status')
      .limit(10);

    // Get pumps at this station
    const pumps = await Pump.find({ stationID: stationId })
      .populate('fuelID', 'FuelType UnitPrice')
      .limit(10);

    // Get recent sales
    const recentSales = await Sale.find({ stationID: stationId })
      .populate('atendentID', 'Name')
      .populate('customer_id', 'name')
      .sort({ created_at: -1 })
      .limit(10);

    // Get sales statistics
    const salesStats = await Sale.aggregate([
      { $match: { stationID: stationId } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
          totalLiters: { $sum: "$ltrSold" }
        }
      }
    ]);

    // Get daily sales for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailySales = await Sale.aggregate([
      { 
        $match: { 
          stationID: stationId,
          created_at: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$amount" },
          liters: { $sum: "$ltrSold" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stationDetails = {
      ...station.toObject(),
      employees: {
        total: await Employee.countDocuments({ StationID: stationId }),
        active: await Employee.countDocuments({ StationID: stationId, status: 1 }),
        list: employees
      },
      pumps: {
        total: await Pump.countDocuments({ stationID: stationId }),
        active: await Pump.countDocuments({ stationID: stationId, status: 1 }),
        list: pumps
      },
      sales: salesStats[0] || { totalSales: 0, totalRevenue: 0, totalLiters: 0 },
      recentSales,
      dailySales
    };

    res.status(200).json({
      success: true,
      data: stationDetails
    });
  } catch (error) {
    next(error);
  }
};

// Update station
export const updateStation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if station exists
    const existingStation = await Station.findById(id);
    if (!existingStation) {
      return next(createError(404, "Station not found"));
    }

    // Check for duplicate station name in same location
    if (updates.Name || updates.Location) {
      const name = updates.Name || existingStation.Name;
      const location = updates.Location || existingStation.Location;
      
      const duplicate = await Station.findOne({
        Name: { $regex: new RegExp(`^${name}$`, 'i') },
        Location: { $regex: new RegExp(`^${location}$`, 'i') },
        _id: { $ne: id }
      });

      if (duplicate) {
        return next(createError(400, "Station with this name already exists in this location"));
      }
    }

    const updatedStation = await Station.findByIdAndUpdate(
      id,
      { ...updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Station updated successfully",
      data: updatedStation
    });
  } catch (error) {
    next(error);
  }
};

// Delete station
export const deleteStation = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id);
    
    if (!station) {
      return next(createError(404, "Station not found"));
    }

    // Check if station has employees
    const employeeCount = await Employee.countDocuments({ StationID: req.params.id });
    if (employeeCount > 0) {
      return next(createError(400, "Cannot delete station with assigned employees"));
    }

    // Check if station has pumps
    const pumpCount = await Pump.countDocuments({ stationID: req.params.id });
    if (pumpCount > 0) {
      return next(createError(400, "Cannot delete station with pumps"));
    }

    // Check if station has sales records
    const salesCount = await Sale.countDocuments({ stationID: req.params.id });
    if (salesCount > 0) {
      return next(createError(400, "Cannot delete station with sales records"));
    }

    await Station.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Station deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Toggle station status
export const toggleStationStatus = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id);
    
    if (!station) {
      return next(createError(404, "Station not found"));
    }

    station.status = station.status === "1" ? "0" : "1";
    await station.save();

    res.status(200).json({
      success: true,
      message: `Station ${station.status === "1" ? 'activated' : 'deactivated'} successfully`,
      data: station
    });
  } catch (error) {
    next(error);
  }
};

// Get station statistics
export const getStationStats = async (req, res, next) => {
  try {
    // Overall statistics
    const totalStations = await Station.countDocuments();
    const activeStations = await Station.countDocuments({ status: "1" });

    // Station status distribution
    const statusDistribution = await Station.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top performing stations by sales
    const topStations = await Sale.aggregate([
      {
        $group: {
          _id: "$stationID",
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
          totalLiters: { $sum: "$ltrSold" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
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
          stationName: "$stationInfo.Name",
          location: "$stationInfo.Location",
          totalSales: 1,
          totalRevenue: 1,
          totalLiters: 1
        }
      }
    ]);

    // Get station growth (stations created per month)
    const monthlyGrowth = await Station.aggregate([
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
        totalStations,
        activeStations,
        inactiveStations: totalStations - activeStations,
        statusDistribution,
        topStations,
        monthlyGrowth
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get station performance report
export const getStationPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {};
    
    if (startDate || endDate) {
      matchQuery.created_at = {};
      if (startDate) {
        matchQuery.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.created_at.$lte = new Date(endDate);
      }
    }

    const performance = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$stationID",
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
          totalLiters: { $sum: "$ltrSold" },
          avgSaleAmount: { $avg: "$amount" },
          fuelTypes: { $addToSet: "$fuelType" }
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
          stationName: "$stationInfo.Name",
          location: "$stationInfo.Location",
          contactNumber: "$stationInfo.ContactNumber",
          status: "$stationInfo.status",
          totalSales: 1,
          totalRevenue: 1,
          totalLiters: 1,
          avgSaleAmount: 1,
          fuelTypes: 1,
          efficiency: { $divide: ["$totalRevenue", "$totalLiters"] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Calculate summary statistics
    const summary = performance.reduce((acc, station) => ({
      totalStations: acc.totalStations + 1,
      totalSales: acc.totalSales + station.totalSales,
      totalRevenue: acc.totalRevenue + station.totalRevenue,
      totalLiters: acc.totalLiters + station.totalLiters
    }), {
      totalStations: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalLiters: 0
    });

    summary.avgRevenuePerStation = summary.totalRevenue / (summary.totalStations || 1);
    summary.avgSalesPerStation = summary.totalSales / (summary.totalStations || 1);

    res.status(200).json({
      success: true,
      data: {
        performance,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

// Assign manager to station
export const assignStationManager = async (req, res, next) => {
  try {
    const { stationId, employeeId } = req.params;

    // Check if station exists
    const station = await Station.findById(stationId);
    if (!station) {
      return next(createError(404, "Station not found"));
    }

    // Check if employee exists and is a manager
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return next(createError(404, "Employee not found"));
    }

    if (employee.Role !== 'station_manager' && employee.Role !== 'admin') {
      return next(createError(400, "Only station managers or admins can be assigned as station managers"));
    }

    // Update employee's station assignment
    employee.StationID = stationId;
    await employee.save();

    res.status(200).json({
      success: true,
      message: "Station manager assigned successfully",
      data: {
        station: {
          _id: station._id,
          Name: station.Name,
          Location: station.Location
        },
        manager: {
          _id: employee._id,
          Name: employee.Name,
          Email: employee.Email,
          Role: employee.Role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get station inventory (available fuels)
export const getStationInventory = async (req, res, next) => {
  try {
    const { stationId } = req.params;

    // Get all pumps at this station
    const pumps = await Pump.find({ stationID: stationId })
      .populate('fuelID')
      .select('pumpName fuelID status');

    // Group fuels by type and calculate total available pumps
    const fuelInventory = pumps.reduce((acc, pump) => {
      if (pump.fuelID) {
        const fuelType = pump.fuelID.FuelType;
        if (!acc[fuelType]) {
          acc[fuelType] = {
            fuelType: fuelType,
            unitPrice: pump.fuelID.UnitPrice,
            totalPumps: 0,
            activePumps: 0,
            availableLiters: pump.fuelID.AvailableLiters || 0,
            supplier: pump.fuelID.Supplier
          };
        }
        acc[fuelType].totalPumps++;
        if (pump.status === 1) {
          acc[fuelType].activePumps++;
        }
      }
      return acc;
    }, {});

    // Convert to array
    const inventory = Object.values(fuelInventory);

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// Export stations to CSV
export const exportStationsToCSV = async (req, res, next) => {
  try {
    const stations = await Station.find()
      .sort({ Name: 1 })
      .lean();

    // Get additional data for each station
    const stationsWithDetails = await Promise.all(stations.map(async (station) => {
      const employeeCount = await Employee.countDocuments({ StationID: station._id });
      const pumpCount = await Pump.countDocuments({ stationID: station._id });
      const salesCount = await Sale.countDocuments({ stationID: station._id });

      return {
        ...station,
        employeeCount,
        pumpCount,
        salesCount
      };
    }));

    // Convert to CSV format
    const csvData = [
      ['Station Name', 'Location', 'Contact Number', 'Status', 'Employees', 'Pumps', 'Total Sales'],
      ...stationsWithDetails.map(station => [
        station.Name,
        station.Location,
        station.ContactNumber || '',
        station.status === "1" ? 'Active' : 'Inactive',
        station.employeeCount,
        station.pumpCount,
        station.salesCount
      ])
    ].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stations_report.csv"');
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};