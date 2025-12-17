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
  Alert,
  Snackbar,
  Pagination,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Stack,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Tooltip,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  LocalGasStation as FuelIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  AddCircle as AddStockIcon,
  RemoveCircle as ReduceStockIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const Fuel = () => {
  const [fuels, setFuels] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFuel, setCurrentFuel] = useState({
    FuelType: '',
    UnitPrice: 0,
    AvailableLiters: 0,
    Supplier: '',
    Status: 1
  });
  const [stockOperation, setStockOperation] = useState({
    operation: 'add',
    liters: 0,
    price: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [sortBy, setSortBy] = useState('Date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  const [stats, setStats] = useState(null);
  const [lowStockFuels, setLowStockFuels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [priceHistory, setPriceHistory] = useState({});

  // Fetch fuels
  const fetchFuels = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        ...(statusFilter && { status: statusFilter }),
        ...(supplierFilter && { supplier: supplierFilter }),
        sortBy,
        sortOrder
      };

      const response = await axios.get('/api/fuels', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setFuels(response.data.data);
        setPagination(response.data.pagination);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
        
        // Extract unique suppliers
        const uniqueSuppliers = [...new Set(response.data.data.map(fuel => fuel.Supplier))];
        setSuppliers(uniqueSuppliers);
      }
    } catch (error) {
      showAlert('Error fetching fuels', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/fuels/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch low stock fuels
  const fetchLowStockFuels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/fuels/low-stock', {
        headers: { Authorization: `Bearer ${token}` },
        params: { threshold: 5000 }
      });
      if (response.data.success) {
        setLowStockFuels(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching low stock fuels:', error);
    }
  };

  // Fetch price history (simulated)
  const fetchPriceHistory = async () => {
    // This is a simulation - in real app, you would fetch from API
    const history = {
      'Petrol': [95, 96, 97, 98, 99, 100, 101],
      'Diesel': [85, 86, 87, 88, 89, 90, 91],
      'Kerosene': [70, 71, 72, 73, 74, 75, 76]
    };
    setPriceHistory(history);
  };

  useEffect(() => {
    fetchFuels();
    fetchStats();
    fetchLowStockFuels();
    fetchPriceHistory();
  }, [searchTerm, statusFilter, supplierFilter, sortBy, sortOrder]);

  const handleOpenDialog = (fuel = null) => {
    if (fuel) {
      setCurrentFuel(fuel);
      setEditMode(true);
    } else {
      setCurrentFuel({
        FuelType: '',
        UnitPrice: 0,
        AvailableLiters: 0,
        Supplier: '',
        Status: 1
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleOpenStockDialog = (fuel) => {
    setCurrentFuel(fuel);
    setStockOperation({
      operation: 'add',
      liters: 0,
      price: fuel.UnitPrice
    });
    setOpenStockDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentFuel({
      FuelType: '',
      UnitPrice: 0,
      AvailableLiters: 0,
      Supplier: '',
      Status: 1
    });
  };

  const handleCloseStockDialog = () => {
    setOpenStockDialog(false);
    setStockOperation({
      operation: 'add',
      liters: 0,
      price: 0
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentFuel(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStockOperationChange = (e) => {
    const { name, value } = e.target;
    setStockOperation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!currentFuel.FuelType.trim()) {
      showAlert('Fuel type is required', 'error');
      return false;
    }
    if (currentFuel.UnitPrice <= 0) {
      showAlert('Unit price must be greater than 0', 'error');
      return false;
    }
    if (currentFuel.AvailableLiters < 0) {
      showAlert('Available liters cannot be negative', 'error');
      return false;
    }
    if (!currentFuel.Supplier.trim()) {
      showAlert('Supplier is required', 'error');
      return false;
    }
    return true;
  };

  const validateStockOperation = () => {
    if (stockOperation.liters <= 0) {
      showAlert('Liters must be greater than 0', 'error');
      return false;
    }
    if (stockOperation.operation === 'reduce' && stockOperation.liters > currentFuel.AvailableLiters) {
      showAlert('Insufficient fuel stock', 'error');
      return false;
    }
    if (stockOperation.operation === 'add' && stockOperation.price <= 0) {
      showAlert('Price must be greater than 0 when adding stock', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (editMode) {
        response = await axios.put(
          `/api/fuels/${currentFuel._id}`,
          currentFuel,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          '/api/fuels',
          currentFuel,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        showAlert(
          editMode ? 'Fuel updated successfully!' : 'Fuel created successfully!',
          'success'
        );
        fetchFuels();
        fetchStats();
        handleCloseDialog();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving fuel', 'error');
    }
  };

  const handleStockUpdate = async () => {
    if (!validateStockOperation()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/fuels/${currentFuel._id}/stock`,
        stockOperation,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        fetchFuels();
        fetchStats();
        fetchLowStockFuels();
        handleCloseStockDialog();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error updating stock', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fuel type?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `/api/fuels/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          showAlert('Fuel deleted successfully!', 'success');
          fetchFuels();
          fetchStats();
        }
      } catch (error) {
        showAlert(error.response?.data?.message || 'Error deleting fuel', 'error');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/fuels/${id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        fetchFuels();
      }
    } catch (error) {
      showAlert('Error updating status', 'error');
    }
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
    fetchFuels(value);
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const getFuelColor = (fuelType) => {
    const colors = {
      'Petrol': '#ff6b6b',
      'Diesel': '#4ecdc4',
      'Kerosene': '#45b7d1',
      'Premium': '#96ceb4',
      'Super': '#feca57',
      'Regular': '#ff9ff3'
    };
    return colors[fuelType] || '#8395a7';
  };

  const getStockLevelColor = (liters) => {
    if (liters > 10000) return 'success';
    if (liters > 5000) return 'warning';
    return 'error';
  };

  const getStockLevelPercentage = (liters) => {
    // Assuming max capacity is 20000 liters
    return Math.min((liters / 20000) * 100, 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: Object.entries(priceHistory).map(([fuelType, prices]) => ({
      label: fuelType,
      data: prices,
      borderColor: getFuelColor(fuelType),
      backgroundColor: getFuelColor(fuelType) + '20',
      fill: true,
      tension: 0.4
    }))
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Fuel Price Trends'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price per Liter ($)'
        }
      }
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 3 }}>
        Fuel Management
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Fuels" />
          <Tab label="Low Stock" />
          <Tab label="Statistics" />
          <Tab label="Price Trends" />
        </Tabs>
      </Box>

      {/* Statistics Cards - Only show on All Fuels tab */}
      {tabValue === 0 && stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <InventoryIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Liters
                    </Typography>
                    <Typography variant="h5">
                      {stats.totalLiters?.toLocaleString()} L
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <MoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Value
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(stats.totalValue || 0)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <FuelIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Fuel Types
                    </Typography>
                    <Typography variant="h5">
                      {fuels.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Low Stock Items
                    </Typography>
                    <Typography variant="h5" color="error">
                      {lowStockFuels.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filter Bar - Hide on Statistics and Trends tabs */}
      {tabValue !== 2 && tabValue !== 3 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search fuels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  label="Supplier"
                >
                  <MenuItem value="">All Suppliers</MenuItem>
                  {suppliers.map((supplier, index) => (
                    <MenuItem key={index} value={supplier}>
                      {supplier}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="FuelType">Fuel Type</MenuItem>
                  <MenuItem value="UnitPrice">Price</MenuItem>
                  <MenuItem value="AvailableLiters">Stock</MenuItem>
                  <MenuItem value="Date">Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  label="Order"
                >
                  <MenuItem value="asc">Asc</MenuItem>
                  <MenuItem value="desc">Desc</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Fuel
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Content based on selected tab */}
      {tabValue === 0 && (
        <>
          {/* Fuels Table */}
          <TableContainer component={Paper}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fuel Type</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Available Stock</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fuels.map((fuel) => (
                    <TableRow key={fuel._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              mr: 2, 
                              bgcolor: getFuelColor(fuel.FuelType),
                              width: 32,
                              height: 32
                            }}
                          >
                            <FuelIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="body1" fontWeight="medium">
                            {fuel.FuelType}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {formatCurrency(fuel.UnitPrice)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          per liter
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body1">
                              {fuel.AvailableLiters.toLocaleString()} L
                            </Typography>
                            <Chip
                              label={getStockLevelPercentage(fuel.AvailableLiters).toFixed(0) + '%'}
                              size="small"
                              color={getStockLevelColor(fuel.AvailableLiters)}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={getStockLevelPercentage(fuel.AvailableLiters)}
                            color={getStockLevelColor(fuel.AvailableLiters)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {formatCurrency(fuel.AvailableLiters * fuel.UnitPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fuel.Supplier}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fuel.Status === 1 ? 'Active' : 'Inactive'}
                          color={fuel.Status === 1 ? 'success' : 'default'}
                          size="small"
                          icon={fuel.Status === 1 ? <ActiveIcon /> : <InactiveIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(fuel)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Manage Stock">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenStockDialog(fuel)}
                            color="info"
                          >
                            <InventoryIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={fuel.Status === 1 ? "Deactivate" : "Activate"}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(fuel._id, fuel.Status)}
                            color={fuel.Status === 1 ? "default" : "success"}
                          >
                            {fuel.Status === 1 ? <InactiveIcon /> : <ActiveIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(fuel._id)}
                            color="error"
                            disabled={fuel.AvailableLiters > 0}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
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
        </>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          {lowStockFuels.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No low stock items. All fuels are well stocked!
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fuel Type</TableCell>
                  <TableCell>Available Stock</TableCell>
                  <TableCell>Recommended Reorder</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockFuels.map((fuel) => (
                  <TableRow key={fuel._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            mr: 2, 
                            bgcolor: getFuelColor(fuel.FuelType),
                            width: 32,
                            height: 32
                          }}
                        >
                          <WarningIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body1" fontWeight="medium">
                          {fuel.FuelType}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${fuel.AvailableLiters.toLocaleString()} L`}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" color="success.main">
                        {(10000 - fuel.AvailableLiters).toLocaleString()} L
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {fuel.Supplier}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(fuel.UnitPrice)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddStockIcon />}
                        onClick={() => handleOpenStockDialog(fuel)}
                        color="success"
                      >
                        Reorder
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

      {tabValue === 2 && stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fuel Types Distribution
                </Typography>
                {stats.fuelTypes?.map((fuelType, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {fuelType.fuelType}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {fuelType.totalLiters.toLocaleString()} L
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(fuelType.totalLiters / (stats.fuelTypes.reduce((sum, ft) => sum + ft.totalLiters, 0) || 1)) * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: getFuelColor(fuelType.fuelType) + '20'
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {fuelType.count} entries
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg: {formatCurrency(fuelType.avgPrice || 0)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Suppliers Overview
                </Typography>
                {stats.suppliers?.map((supplier, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {supplier.supplier}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {supplier.fuelTypes?.map((type, idx) => (
                        <Chip
                          key={idx}
                          label={type}
                          size="small"
                          sx={{ bgcolor: getFuelColor(type) }}
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Supplies {supplier.count} fuel type(s)
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Line data={chartData} options={chartOptions} />
          </CardContent>
        </Card>
      )}

      {/* Fuel Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Fuel' : 'Add New Fuel'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Fuel Type *"
                  name="FuelType"
                  value={currentFuel.FuelType}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: <FuelIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Unit Price *"
                  name="UnitPrice"
                  type="number"
                  value={currentFuel.UnitPrice}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Available Liters"
                  name="AvailableLiters"
                  type="number"
                  value={currentFuel.AvailableLiters}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Supplier *"
                  name="Supplier"
                  value={currentFuel.Supplier}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="Status"
                    value={currentFuel.Status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value={1}>Active</MenuItem>
                    <MenuItem value={0}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Management Dialog */}
      <Dialog open={openStockDialog} onClose={handleCloseStockDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manage Fuel Stock - {currentFuel.FuelType}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Operation *</InputLabel>
                  <Select
                    name="operation"
                    value={stockOperation.operation}
                    onChange={handleStockOperationChange}
                    label="Operation *"
                  >
                    <MenuItem value="add">
                      <AddStockIcon sx={{ mr: 1 }} />
                      Add Stock
                    </MenuItem>
                    <MenuItem value="reduce">
                      <ReduceStockIcon sx={{ mr: 1 }} />
                      Reduce Stock
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Liters *"
                  name="liters"
                  type="number"
                  value={stockOperation.liters}
                  onChange={handleStockOperationChange}
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: <Typography sx={{ ml: 1 }}>L</Typography>
                  }}
                />
              </Grid>
              {stockOperation.operation === 'add' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Price per Liter"
                    name="price"
                    type="number"
                    value={stockOperation.price}
                    onChange={handleStockOperationChange}
                    margin="normal"
                    InputProps={{
                      startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    helperText="Current price: $1.50"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Current stock: {currentFuel.AvailableLiters?.toLocaleString()} L
                  {stockOperation.operation === 'add' ? (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      New stock after operation: {(currentFuel.AvailableLiters + (parseFloat(stockOperation.liters) || 0)).toLocaleString()} L
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      New stock after operation: {(currentFuel.AvailableLiters - (parseFloat(stockOperation.liters) || 0)).toLocaleString()} L
                    </Typography>
                  )}
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStockDialog}>Cancel</Button>
          <Button onClick={handleStockUpdate} variant="contained" color="primary">
            Update Stock
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

export default Fuel;