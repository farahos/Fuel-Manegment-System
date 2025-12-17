import Sale from "../model/Sale.js";
import Employee from "../model/Employees.js";
import Station from "../model/Station.js";
import Customer from "../model/Customers.js";
import Pump from "../model/Pump.js";
// import Fuel from "../model/Fuel.js";
import { createError } from "../utils/error.js";

// Generate unique transaction number
const generateTransactionNo = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Get today's sales count
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const todaySalesCount = await Sale.countDocuments({
    created_at: { $gte: startOfDay, $lte: endOfDay }
  });
  
  const serial = (todaySalesCount + 1).toString().padStart(4, '0');
  return `TRX${year}${month}${day}${serial}`;
};

// Create new sale
export const createSale = async (req, res, next) => {
  try {
    const { 
      atendentID, 
      fuelType, 
      pumpNo, 
      unitPrice, 
      preRead, 
      curRead, 
      ltrSold, 
      amount, 
      payment_method, 
      entry_method, 
      tax, 
      sales_ref, 
      stationID, 
      customer_id 
    } = req.body;

    // Validate required fields
    if (!atendentID || !stationID || !fuelType || !pumpNo) {
      return next(createError(400, "Missing required fields"));
    }

    // Validate attendent exists
    const attendent = await Employee.findById(atendentID).select('-Password');
    if (!atendent) {
      return next(createError(404, "Atendent not found"));
    }

    // Validate station exists
    const station = await Station.findById(stationID);
    if (!station) {
      return next(createError(404, "Station not found"));
    }

    // Validate customer if provided
    let customer = null;
    if (customer_id) {
      customer = await Customer.findById(customer_id);
      if (!customer) {
        return next(createError(404, "Customer not found"));
      }
    }

    // Validate readings
    if (curRead <= preRead) {
      return next(createError(400, "Current reading must be greater than previous reading"));
    }

    // Validate liters sold
    const calculatedLiters = curRead - preRead;
    if (ltrSold !== calculatedLiters) {
      return next(createError(400, "Liters sold must match the difference between current and previous readings"));
    }

    // Validate amount
    const calculatedAmount = ltrSold * unitPrice;
    if (Math.abs(amount - calculatedAmount) > 0.01) { // Allow small rounding differences
      return next(createError(400, "Amount must equal liters sold multiplied by unit price"));
    }

    // Generate transaction number
    const transaction_no = await generateTransactionNo();

    const newSale = new Sale({
      atendentID,
      transaction_no,
      fuelType,
      pumpNo,
      unitPrice,
      preRead,
      curRead,
      ltrSold,
      amount,
      payment_method: payment_method || 'cash',
      entry_method: entry_method || 'manual',
      tax: tax || 0,
      sales_ref,
      stationID,
      customer_id: customer_id || null,
      created_at: new Date()
    });

    const savedSale = await newSale.save();
    
    // Populate references for response
    const populatedSale = await Sale.findById(savedSale._id)
      .populate('atendentID', 'Name Email')
      .populate('stationID', 'name location')
      .populate('customer_id', 'name phone email');

    res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      data: populatedSale
    });
  } catch (error) {
    next(error);
  }
};

// Get all sales
export const getSales = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      startDate, 
      endDate,
      stationID,
      fuelType,
      payment_method,
      sortBy = "created_at",
      sortOrder = "desc"
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { transaction_no: { $regex: search, $options: "i" } },
        { fuelType: { $regex: search, $options: "i" } },
        { pumpNo: { $regex: search, $options: "i" } },
        { sales_ref: { $regex: search, $options: "i" } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) {
        query.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        query.created_at.$lte = new Date(endDate);
      }
    }

    // Filter by station
    if (stationID) {
      query.stationID = stationID;
    }

    // Filter by fuel type
    if (fuelType) {
      query.fuelType = { $regex: fuelType, $options: "i" };
    }

    // Filter by payment method
    if (payment_method) {
      query.payment_method = payment_method;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const sales = await Sale.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions)
      .populate('atendentID', 'Name Email')
      .populate('stationID', 'name location')
      .populate('customer_id', 'name phone email');

    const total = await Sale.countDocuments(query);

    // Calculate sales statistics
    const statistics = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalLiters: { $sum: "$ltrSold" },
          totalAmount: { $sum: "$amount" },
          totalTax: { $sum: "$tax" }
        }
      }
    ]);

    // Get daily sales breakdown
    const dailySales = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            fuelType: "$fuelType"
          },
          liters: { $sum: "$ltrSold" },
          amount: { $sum: "$amount" },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": -1 } },
      { $limit: 30 }
    ]);

    // Get top selling fuels
    const topFuels = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$fuelType",
          liters: { $sum: "$ltrSold" },
          amount: { $sum: "$amount" },
          transactions: { $sum: 1 },
          avgPrice: { $avg: "$unitPrice" }
        }
      },
      { $sort: { liters: -1 } },
      { $limit: 5 }
    ]);

    // Get payment method distribution
    const paymentDistribution = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$payment_method",
          count: { $sum: 1 },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    const stats = statistics[0] || { 
      totalSales: 0, 
      totalLiters: 0, 
      totalAmount: 0, 
      totalTax: 0 
    };

    res.status(200).json({
      success: true,
      data: sales,
      statistics: {
        ...stats,
        dailySales,
        topFuels,
        paymentDistribution
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

// Get single sale by ID
export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('atendentID', 'Name Email ContactNumber')
      .populate('stationID', 'name location address phone')
      .populate('customer_id', 'name phone email address');

    if (!sale) {
      return next(createError(404, "Sale not found"));
    }

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

// Update sale
export const updateSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if sale exists
    const existingSale = await Sale.findById(id);
    if (!existingSale) {
      return next(createError(404, "Sale not found"));
    }

    // Validate attendent if being updated
    if (updates.atendentID) {
      const attendent = await Employee.findById(updates.atendentID);
      if (!atendent) {
        return next(createError(404, "Atendent not found"));
      }
    }

    // Validate station if being updated
    if (updates.stationID) {
      const station = await Station.findById(updates.stationID);
      if (!station) {
        return next(createError(404, "Station not found"));
      }
    }

    // Validate customer if being updated
    if (updates.customer_id) {
      const customer = await Customer.findById(updates.customer_id);
      if (!customer) {
        return next(createError(404, "Customer not found"));
      }
    }

    // Validate readings if updated
    if (updates.preRead !== undefined || updates.curRead !== undefined) {
      const preRead = updates.preRead || existingSale.preRead;
      const curRead = updates.curRead || existingSale.curRead;
      
      if (curRead <= preRead) {
        return next(createError(400, "Current reading must be greater than previous reading"));
      }
    }

    // Calculate liters and amount if readings or price changed
    if (updates.preRead !== undefined || updates.curRead !== undefined || updates.unitPrice !== undefined) {
      const preRead = updates.preRead || existingSale.preRead;
      const curRead = updates.curRead || existingSale.curRead;
      const unitPrice = updates.unitPrice || existingSale.unitPrice;
      
      const ltrSold = curRead - preRead;
      const amount = ltrSold * unitPrice;
      
      updates.ltrSold = ltrSold;
      updates.amount = amount;
    }

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      { ...updates },
      { new: true, runValidators: true }
    )
    .populate('atendentID', 'Name Email')
    .populate('stationID', 'name location')
    .populate('customer_id', 'name phone email');

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: updatedSale
    });
  } catch (error) {
    next(error);
  }
};

// Delete sale
export const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return next(createError(404, "Sale not found"));
    }

    // Prevent deleting sales older than 24 hours
    const saleDate = new Date(sale.created_at);
    const now = new Date();
    const hoursDiff = (now - saleDate) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return next(createError(400, "Cannot delete sales older than 24 hours"));
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Sale deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Get sales by station
export const getSalesByStation = async (req, res, next) => {
  try {
    const { stationID } = req.params;
    const { startDate, endDate } = req.query;

    let query = { stationID };

    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) {
        query.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        query.created_at.$lte = new Date(endDate);
      }
    }

    const sales = await Sale.find(query)
      .populate('atendentID', 'Name')
      .populate('customer_id', 'name')
      .sort({ created_at: -1 })
      .limit(100);

    const station = await Station.findById(stationID).select('name location');

    // Calculate station statistics
    const stats = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalLiters: { $sum: "$ltrSold" },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: sales,
      station,
      statistics: stats[0] || { totalSales: 0, totalLiters: 0, totalAmount: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// Get sales by customer
export const getSalesByCustomer = async (req, res, next) => {
  try {
    const { customerID } = req.params;
    const { startDate, endDate } = req.query;

    let query = { customer_id: customerID };

    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) {
        query.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        query.created_at.$lte = new Date(endDate);
      }
    }

    const sales = await Sale.find(query)
      .populate('atendentID', 'Name')
      .populate('stationID', 'name location')
      .sort({ created_at: -1 });

    const customer = await Customer.findById(customerID).select('name phone email');

    // Calculate customer statistics
    const stats = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalLiters: { $sum: "$ltrSold" },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: sales,
      customer,
      statistics: stats[0] || { totalSales: 0, totalLiters: 0, totalAmount: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// Get today's sales summary
export const getTodaysSales = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      created_at: { $gte: today, $lt: tomorrow }
    };

    const todaySales = await Sale.find(query)
      .populate('atendentID', 'Name')
      .populate('stationID', 'name')
      .sort({ created_at: -1 });

    // Calculate hourly sales
    const hourlySales = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $hour: "$created_at" },
          sales: { $sum: 1 },
          liters: { $sum: "$ltrSold" },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Calculate fuel-wise sales
    const fuelSales = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$fuelType",
          liters: { $sum: "$ltrSold" },
          amount: { $sum: "$amount" },
          sales: { $sum: 1 }
        }
      },
      { $sort: { liters: -1 } }
    ]);

    // Calculate payment method distribution
    const paymentStats = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$payment_method",
          sales: { $sum: 1 },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Calculate overall statistics
    const overallStats = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalLiters: { $sum: "$ltrSold" },
          totalAmount: { $sum: "$amount" },
          avgSaleAmount: { $avg: "$amount" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: todaySales,
      statistics: {
        hourlySales,
        fuelSales,
        paymentStats,
        overallStats: overallStats[0] || {
          totalSales: 0,
          totalLiters: 0,
          totalAmount: 0,
          avgSaleAmount: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get sales report by date range
export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return next(createError(400, "Start date and end date are required"));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const matchQuery = {
      created_at: { $gte: start, $lte: end }
    };

    let groupStage;
    switch (groupBy) {
      case 'hour':
        groupStage = {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            hour: { $hour: "$created_at" }
          }
        };
        break;
      case 'day':
        groupStage = {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }
        };
        break;
      case 'month':
        groupStage = {
          _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } }
        };
        break;
      default:
        groupStage = {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }
        };
    }

    const report = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          ...groupStage,
          totalSales: { $sum: 1 },
          totalLiters: { $sum: "$ltrSold" },
          totalAmount: { $sum: "$amount" },
          totalTax: { $sum: "$tax" },
          avgUnitPrice: { $avg: "$unitPrice" },
          uniqueCustomers: { $addToSet: "$customer_id" }
        }
      },
      {
        $project: {
          period: "$_id",
          totalSales: 1,
          totalLiters: 1,
          totalAmount: 1,
          totalTax: 1,
          avgUnitPrice: 1,
          customerCount: { $size: "$uniqueCustomers" },
          avgSaleAmount: { $divide: ["$totalAmount", "$totalSales"] }
        }
      },
      { $sort: { period: 1 } }
    ]);

    // Get top products
    const topProducts = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$fuelType",
          liters: { $sum: "$ltrSold" },
          amount: { $sum: "$amount" },
          sales: { $sum: 1 }
        }
      },
      { $sort: { liters: -1 } },
      { $limit: 5 }
    ]);

    // Get top stations
    const topStations = await Sale.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "stations",
          localField: "stationID",
          foreignField: "_id",
          as: "station"
        }
      },
      { $unwind: "$station" },
      {
        $group: {
          _id: "$station.name",
          location: { $first: "$station.location" },
          liters: { $sum: "$ltrSold" },
          amount: { $sum: "$amount" },
          sales: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        report,
        summary: {
          totalPeriods: report.length,
          totalSales: report.reduce((sum, item) => sum + item.totalSales, 0),
          totalLiters: report.reduce((sum, item) => sum + item.totalLiters, 0),
          totalAmount: report.reduce((sum, item) => sum + item.totalAmount, 0),
          totalTax: report.reduce((sum, item) => sum + item.totalTax, 0)
        },
        topProducts,
        topStations
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export sales to CSV
export const exportSalesToCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, stationID } = req.query;

    let query = {};
    
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) {
        query.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        query.created_at.$lte = new Date(endDate);
      }
    }

    if (stationID) {
      query.stationID = stationID;
    }

    const sales = await Sale.find(query)
      .populate('atendentID', 'Name')
      .populate('stationID', 'name')
      .populate('customer_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    // Convert to CSV format
    const csvData = [
      ['Transaction No', 'Date', 'Time', 'Fuel Type', 'Pump No', 'Liters', 'Unit Price', 'Amount', 'Tax', 'Payment Method', 'Atendent', 'Station', 'Customer'],
      ...sales.map(sale => [
        sale.transaction_no,
        new Date(sale.created_at).toLocaleDateString(),
        new Date(sale.created_at).toLocaleTimeString(),
        sale.fuelType,
        sale.pumpNo,
        sale.ltrSold.toFixed(2),
        sale.unitPrice.toFixed(2),
        sale.amount.toFixed(2),
        (sale.tax || 0).toFixed(2),
        sale.payment_method || 'cash',
        sale.atendentID?.Name || 'N/A',
        sale.stationID?.name || 'N/A',
        sale.customer_id?.name || 'Walk-in'
      ])
    ].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};