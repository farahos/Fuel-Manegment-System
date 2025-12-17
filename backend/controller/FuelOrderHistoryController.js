import FuelOrderHistory from "../model/FuelOrderHistory.js"
import Fuel from "../model/Fuel.js"
import { createError } from "../utils/error.js";

// Create new fuel order
export const createFuelOrder = async (req, res, next) => {
  try {
    const { 
      fuel_type, 
      quantity_liters, 
      unit_price, 
      supplier_name, 
      received_by, 
      delivery_note, 
      remarks 
    } = req.body;

    // Calculate total cost
    const total_cost = quantity_liters * unit_price;

    // Check if fuel type exists
    const fuelExists = await Fuel.findOne({ 
      FuelType: { $regex: new RegExp(`^${fuel_type}$`, 'i') }
    });

    if (!fuelExists) {
      return next(createError(400, "Fuel type does not exist in the system"));
    }

    // Validate quantity
    if (quantity_liters <= 0) {
      return next(createError(400, "Quantity must be greater than 0"));
    }

    // Validate unit price
    if (unit_price <= 0) {
      return next(createError(400, "Unit price must be greater than 0"));
    }

    const newFuelOrder = new FuelOrderHistory({
      fuel_type,
      quantity_liters,
      unit_price,
      total_cost,
      supplier_name,
      received_by,
      delivery_note,
      remarks
    });

    const savedOrder = await newFuelOrder.save();
    
    // Update fuel stock
    await Fuel.findOneAndUpdate(
      { FuelType: { $regex: new RegExp(`^${fuel_type}$`, 'i') } },
      { 
        $inc: { AvailableLiters: quantity_liters },
        $set: { UnitPrice: unit_price, Supplier: supplier_name }
      },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Fuel order recorded successfully",
      data: savedOrder
    });
  } catch (error) {
    next(error);
  }
};

// Get all fuel orders
export const getFuelOrders = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      startDate, 
      endDate,
      fuel_type,
      supplier_name,
      sortBy = "date_received",
      sortOrder = "desc"
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { fuel_type: { $regex: search, $options: "i" } },
        { supplier_name: { $regex: search, $options: "i" } },
        { received_by: { $regex: search, $options: "i" } },
        { delivery_note: { $regex: search, $options: "i" } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.date_received = {};
      if (startDate) {
        query.date_received.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date_received.$lte = new Date(endDate);
      }
    }

    // Filter by fuel type
    if (fuel_type) {
      query.fuel_type = { $regex: fuel_type, $options: "i" };
    }

    // Filter by supplier
    if (supplier_name) {
      query.supplier_name = { $regex: supplier_name, $options: "i" };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const orders = await FuelOrderHistory.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);

    const total = await FuelOrderHistory.countDocuments(query);

    // Calculate total statistics
    const statistics = await FuelOrderHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalLiters: { $sum: "$quantity_liters" },
          totalCost: { $sum: "$total_cost" },
          averageUnitPrice: { $avg: "$unit_price" }
        }
      }
    ]);

    // Get fuel type distribution
    const fuelDistribution = await FuelOrderHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$fuel_type",
          count: { $sum: 1 },
          totalLiters: { $sum: "$quantity_liters" },
          totalCost: { $sum: "$total_cost" }
        }
      },
      { $sort: { totalLiters: -1 } }
    ]);

    // Get monthly statistics
    const monthlyStats = await FuelOrderHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: "$date_received" },
            month: { $month: "$date_received" }
          },
          totalLiters: { $sum: "$quantity_liters" },
          totalCost: { $sum: "$total_cost" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    const stats = statistics[0] || { 
      totalOrders: 0, 
      totalLiters: 0, 
      totalCost: 0, 
      averageUnitPrice: 0 
    };

    res.status(200).json({
      success: true,
      data: orders,
      statistics: {
        ...stats,
        fuelDistribution,
        monthlyStats
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

// Get single order by ID
export const getFuelOrderById = async (req, res, next) => {
  try {
    const order = await FuelOrderHistory.findById(req.params.id);

    if (!order) {
      return next(createError(404, "Fuel order not found"));
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Update fuel order
export const updateFuelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if order exists
    const existingOrder = await FuelOrderHistory.findById(id);
    if (!existingOrder) {
      return next(createError(404, "Fuel order not found"));
    }

    // Calculate total cost if quantity or price changed
    if (updates.quantity_liters || updates.unit_price) {
      const quantity = updates.quantity_liters || existingOrder.quantity_liters;
      const price = updates.unit_price || existingOrder.unit_price;
      updates.total_cost = quantity * price;

      // Check if fuel type changed
      const fuelType = updates.fuel_type || existingOrder.fuel_type;
      
      // Calculate stock adjustment
      const oldQuantity = existingOrder.quantity_liters;
      const newQuantity = updates.quantity_liters || oldQuantity;
      const quantityDiff = newQuantity - oldQuantity;

      // Update fuel stock if quantity changed
      if (quantityDiff !== 0) {
        const fuel = await Fuel.findOne({ 
          FuelType: { $regex: new RegExp(`^${fuelType}$`, 'i') }
        });

        if (fuel) {
          fuel.AvailableLiters += quantityDiff;
          await fuel.save();
        }
      }

      // Update fuel price if unit price changed
      if (updates.unit_price && updates.unit_price !== existingOrder.unit_price) {
        await Fuel.findOneAndUpdate(
          { FuelType: { $regex: new RegExp(`^${fuelType}$`, 'i') } },
          { $set: { UnitPrice: updates.unit_price } },
          { new: true }
        );
      }
    }

    const updatedOrder = await FuelOrderHistory.findByIdAndUpdate(
      id,
      { ...updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Fuel order updated successfully",
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// Delete fuel order
export const deleteFuelOrder = async (req, res, next) => {
  try {
    const order = await FuelOrderHistory.findById(req.params.id);
    
    if (!order) {
      return next(createError(404, "Fuel order not found"));
    }

    // Restore fuel stock
    const fuel = await Fuel.findOne({ 
      FuelType: { $regex: new RegExp(`^${order.fuel_type}$`, 'i') }
    });

    if (fuel) {
      fuel.AvailableLiters -= order.quantity_liters;
      if (fuel.AvailableLiters < 0) fuel.AvailableLiters = 0;
      await fuel.save();
    }

    await FuelOrderHistory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Fuel order deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Get order summary by date range
export const getOrderSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};
    
    if (startDate || endDate) {
      query.date_received = {};
      if (startDate) {
        query.date_received.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date_received.$lte = new Date(endDate);
      }
    }

    const summary = await FuelOrderHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date_received" } },
            fuel_type: "$fuel_type"
          },
          totalLiters: { $sum: "$quantity_liters" },
          totalCost: { $sum: "$total_cost" },
          averagePrice: { $avg: "$unit_price" },
          ordersCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          fuelTypes: {
            $push: {
              fuel_type: "$_id.fuel_type",
              totalLiters: "$totalLiters",
              totalCost: "$totalCost",
              averagePrice: "$averagePrice",
              ordersCount: "$ordersCount"
            }
          },
          dailyTotalLiters: { $sum: "$totalLiters" },
          dailyTotalCost: { $sum: "$totalCost" },
          dailyOrders: { $sum: "$ordersCount" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get top suppliers
    const topSuppliers = await FuelOrderHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$supplier_name",
          totalOrders: { $sum: 1 },
          totalLiters: { $sum: "$quantity_liters" },
          totalCost: { $sum: "$total_cost" }
        }
      },
      { $sort: { totalCost: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary,
        topSuppliers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export orders to CSV
export const exportOrdersToCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};
    
    if (startDate || endDate) {
      query.date_received = {};
      if (startDate) {
        query.date_received.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date_received.$lte = new Date(endDate);
      }
    }

    const orders = await FuelOrderHistory.find(query)
      .sort({ date_received: -1 })
      .lean();

    // Convert to CSV format
    const csvData = [
      ['Fuel Type', 'Quantity (L)', 'Unit Price ($)', 'Total Cost ($)', 'Supplier', 'Received By', 'Delivery Note', 'Date Received', 'Remarks'],
      ...orders.map(order => [
        order.fuel_type,
        order.quantity_liters,
        order.unit_price.toFixed(2),
        order.total_cost.toFixed(2),
        order.supplier_name,
        order.received_by,
        order.delivery_note || '',
        new Date(order.date_received).toLocaleDateString(),
        order.remarks || ''
      ])
    ].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fuel_orders.csv"');
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};

// Get recent orders
export const getRecentOrders = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const recentOrders = await FuelOrderHistory.find()
      .sort({ date_received: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: recentOrders
    });
  } catch (error) {
    next(error);
  }
};