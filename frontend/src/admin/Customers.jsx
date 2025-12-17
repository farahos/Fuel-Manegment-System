import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  Pagination,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    opening_balance: 0,
    status: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });

  // Fetch customers
  const fetchCustomers = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        ...(statusFilter && { status: statusFilter })
      };

      const response = await axios.get('/api/customers', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setCustomers(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      showAlert('Error fetching customers', 'error');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, statusFilter]);

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setCurrentCustomer(customer);
      setEditMode(true);
    } else {
      setCurrentCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        opening_balance: 0,
        status: 1
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      opening_balance: 0,
      status: 1
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      let response;

      if (editMode) {
        response = await axios.put(
          `/api/customers/${currentCustomer._id}`,
          currentCustomer,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          '/api/customers',
          currentCustomer,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        showAlert(
          editMode ? 'Customer updated successfully!' : 'Customer created successfully!',
          'success'
        );
        fetchCustomers();
        handleCloseDialog();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving customer', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `http://localhost:5000/api/customers/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          showAlert('Customer deleted successfully!', 'success');
          fetchCustomers();
        }
      } catch (error) {
        showAlert('Error deleting customer', 'error');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:5000/api/customers/${id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        fetchCustomers();
      }
    } catch (error) {
      showAlert('Error updating status', 'error');
    }
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
    fetchCustomers(value);
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 3 }}>
        Customer Management
      </Typography>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="1">Active</MenuItem>
                <MenuItem value="0">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add New Customer
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Customers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Opening Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.email || '-'}</TableCell>
                <TableCell>{customer.address || '-'}</TableCell>
                <TableCell>
                  ${customer.opening_balance.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={customer.status === 1 ? 'Active' : 'Inactive'}
                    color={customer.status === 1 ? 'success' : 'default'}
                    size="small"
                    icon={customer.status === 1 ? <ActiveIcon /> : <InactiveIcon />}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(customer)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleStatus(customer._id, customer.status)}
                    color={customer.status === 1 ? "default" : "success"}
                  >
                    {customer.status === 1 ? <InactiveIcon /> : <ActiveIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(customer._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Customer Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={currentCustomer.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={currentCustomer.phone}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={currentCustomer.email}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={currentCustomer.address}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Opening Balance"
              name="opening_balance"
              type="number"
              value={currentCustomer.opening_balance}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={currentCustomer.status === 1}
                  onChange={(e) =>
                    setCurrentCustomer(prev => ({
                      ...prev,
                      status: e.target.checked ? 1 : 0
                    }))
                  }
                />
              }
              label={currentCustomer.status === 1 ? "Active" : "Inactive"}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Customer;