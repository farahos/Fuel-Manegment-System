import Customer from "../model/Customers.js"
import { createError } from "../utils/error.js"

// Create new customer
export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, opening_balance, status } = req.body;
    
    // Check if customer already exists with same phone or email
    const existingCustomer = await Customer.findOne({
      $or: [{ phone }, { email }]
    });

    if (existingCustomer) {
      return next(createError(400, "Customer with this phone or email already exists"));
    }

    const newCustomer = new Customer({
      name,
      phone,
      email,
      address,
      opening_balance: opening_balance || 0,
      status: status || 0
    });

    const savedCustomer = await newCustomer.save();
    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: savedCustomer
    });
  } catch (error) {
    next(error);
  }
};

// Get all customers
export const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by status
    if (status !== undefined) {
      query.status = parseInt(status);
    }

    const customers = await Customer.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: customers,
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

// Get single customer by ID
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return next(createError(404, "Customer not found"));
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// Update customer
export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if customer exists
    const existingCustomer = await Customer.findById(id);
    if (!existingCustomer) {
      return next(createError(404, "Customer not found"));
    }

    // If updating phone/email, check for duplicates
    if (updates.phone || updates.email) {
      const duplicate = await Customer.findOne({
        $and: [
          { _id: { $ne: id } },
          { $or: [] }
        ]
      });

      if (updates.phone) {
        duplicate.$or.push({ phone: updates.phone });
      }
      if (updates.email && updates.email !== "") {
        duplicate.$or.push({ email: updates.email });
      }

      if (duplicate.$or.length > 0 && await Customer.findOne(duplicate)) {
        return next(createError(400, "Phone or email already exists"));
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { ...updates, updated_at: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer
    });
  } catch (error) {
    next(error);
  }
};

// Delete customer
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return next(createError(404, "Customer not found"));
    }

    // Check if customer has any related records before deleting
    // You might want to implement soft delete instead
    await Customer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Toggle customer status (active/inactive)
export const toggleCustomerStatus = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return next(createError(404, "Customer not found"));
    }

    customer.status = customer.status === 1 ? 0 : 1;
    customer.updated_at = Date.now();
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Customer ${customer.status === 1 ? 'activated' : 'deactivated'} successfully`,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};