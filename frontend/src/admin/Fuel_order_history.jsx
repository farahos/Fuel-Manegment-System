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
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  TableSortLabel,
  Link,
  Badge,
  InputAdornment,
  Icon
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  LocalGasStation as FuelIcon,
  Download as DownloadIcon,
  BarChart as ChartIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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
  BarElement,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  BarElement,
  ArcElement
);

const FuelOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentOrder, setCurrentOrder] = useState({
    fuel_type: '',
    quantity_liters: 0,
    unit_price: 0,
    supplier_name: '',
    received_by: '',
    delivery_note: '',
    remarks: ''
  });
  const [viewOrder, setViewOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_received');
  const [sortOrder, setSortOrder] = useState('desc');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  // Fetch orders
  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        ...(startDate && { startDate: startDate.toISOString().split('T')[0] }),
        ...(endDate && { endDate: endDate.toISOString().split('T')[0] }),
        ...(fuelTypeFilter && { fuel_type: fuelTypeFilter }),
        ...(supplierFilter && { supplier_name: supplierFilter }),
        sortBy,
        sortOrder
      };

      const response = await axios.get('http://localhost:5000/api/fuel-orders', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setOrders(response.data.data);
        setPagination(response.data.pagination);
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
          
          // Prepare chart data
          if (response.data.statistics.monthlyStats) {
            prepareChartData(response.data.statistics.monthlyStats);
          }
          
          // Extract unique fuel types and suppliers
          const uniqueFuelTypes = [...new Set(response.data.data.map(order => order.fuel_type))];
          const uniqueSuppliers = [...new Set(response.data.data.map(order => order.supplier_name))];
          setFuelTypes(uniqueFuelTypes);
          setSuppliers(uniqueSuppliers);
        }
      }
    } catch (error) {
      showAlert('Error fetching fuel orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        ...(startDate && { startDate: startDate.toISOString().split('T')[0] }),
        ...(endDate && { endDate: endDate.toISOString().split('T')[0] })
      };

      const response = await axios.get('http://localhost:5000/api/fuel-orders/summary', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setSummaryData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const prepareChartData = (monthlyStats) => {
    const labels = monthlyStats.map(stat => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[stat._id.month - 1]} ${stat._id.year}`;
    }).reverse();

    const litersData = monthlyStats.map(stat => stat.totalLiters).reverse();
    const costData = monthlyStats.map(stat => stat.totalCost).reverse();

    setChartData({
      labels,
      datasets: [
        {
          label: 'Total Liters',
          data: litersData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
        },
        {
          label: 'Total Cost ($)',
          data: costData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1',
        }
      ]
    });
  };

  useEffect(() => {
    fetchOrders();
    if (tabValue === 2) {
      fetchSummary();
    }
  }, [searchTerm, startDate, endDate, fuelTypeFilter, supplierFilter, sortBy, sortOrder, tabValue]);

  const handleOpenDialog = (order = null) => {
    if (order) {
      setCurrentOrder(order);
      setEditMode(true);
    } else {
      setCurrentOrder({
        fuel_type: '',
        quantity_liters: 0,
        unit_price: 0,
        supplier_name: '',
        received_by: '',
        delivery_note: '',
        remarks: ''
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleOpenViewDialog = (order) => {
    setViewOrder(order);
    setOpenViewDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentOrder({
      fuel_type: '',
      quantity_liters: 0,
      unit_price: 0,
      supplier_name: '',
      received_by: '',
      delivery_note: '',
      remarks: ''
    });
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewOrder(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentOrder(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!currentOrder.fuel_type.trim()) {
      showAlert('Fuel type is required', 'error');
      return false;
    }
    if (currentOrder.quantity_liters <= 0) {
      showAlert('Quantity must be greater than 0', 'error');
      return false;
    }
    if (currentOrder.unit_price <= 0) {
      showAlert('Unit price must be greater than 0', 'error');
      return false;
    }
    if (!currentOrder.supplier_name.trim()) {
      showAlert('Supplier name is required', 'error');
      return false;
    }
    if (!currentOrder.received_by.trim()) {
      showAlert('Received by field is required', 'error');
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
          `http://localhost:5000/api/fuel-orders/${currentOrder._id}`,
          currentOrder,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          'http://localhost:5000/api/fuel-orders',
          currentOrder,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        showAlert(
          editMode ? 'Fuel order updated successfully!' : 'Fuel order recorded successfully!',
          'success'
        );
        fetchOrders();
        handleCloseDialog();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving fuel order', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fuel order?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `http://localhost:5000/api/fuel-orders/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          showAlert('Fuel order deleted successfully!', 'success');
          fetchOrders();
        }
      } catch (error) {
        showAlert(error.response?.data?.message || 'Error deleting fuel order', 'error');
      }
    }
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
    fetchOrders(value);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        ...(startDate && { startDate: startDate.toISOString().split('T')[0] }),
        ...(endDate && { endDate: endDate.toISOString().split('T')[0] })
      };

      const response = await axios.get('http://localhost:5000/api/fuel-orders/export', {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fuel_orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showAlert('Export completed successfully!', 'success');
    } catch (error) {
      showAlert('Error exporting data', 'error');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setFuelTypeFilter('');
    setSupplierFilter('');
    setSortBy('date_received');
    setSortOrder('desc');
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'Monthly Fuel Orders Trend'
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Liters'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Cost ($)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 3 }}>
          Fuel Order History
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Orders" />
            <Tab label="Statistics" />
            <Tab label="Summary Report" />
          </Tabs>
        </Box>

        {/* Statistics Cards - Only show on All Orders tab */}
        {tabValue === 0 && statistics && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <ReceiptIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Total Orders
                      </Typography>
                      <Typography variant="h5">
                        {statistics.totalOrders}
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
                      <FuelIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Total Liters
                      </Typography>
                      <Typography variant="h5">
                        {statistics.totalLiters?.toLocaleString()} L
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
                      <MoneyIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Total Cost
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(statistics.totalCost || 0)}
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
                      <TrendingUpIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Avg. Price/Liter
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(statistics.averageUnitPrice || 0)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Search and Filter Bar - Hide on Statistics tab */}
        {tabValue !== 1 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="From Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="To Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Fuel Type</InputLabel>
                  <Select
                    value={fuelTypeFilter}
                    onChange={(e) => setFuelTypeFilter(e.target.value)}
                    label="Fuel Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {fuelTypes.map((type, index) => (
                      <MenuItem key={index} value={type}>
                        {type}
                      </MenuItem>
                    ))}
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
              <Grid item xs={12} md={1} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<FilterIcon />}
                  sx={{ height: '56px' }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  New Fuel Order
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCSV}
                  sx={{ ml: 2 }}
                >
                  Export CSV
                </Button>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {orders.length} of {pagination.totalItems} orders
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Content based on selected tab */}
        {tabValue === 0 && (
          <>
            {/* Orders Table */}
            <TableContainer component={Paper}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'date_received'}
                          direction={sortOrder}
                          onClick={() => handleSort('date_received')}
                        >
                          Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'fuel_type'}
                          direction={sortOrder}
                          onClick={() => handleSort('fuel_type')}
                        >
                          Fuel Type
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'quantity_liters'}
                          direction={sortOrder}
                          onClick={() => handleSort('quantity_liters')}
                        >
                          Quantity
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Total Cost</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Received By</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order._id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(order.date_received)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(order.date_received).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: getFuelColor(order.fuel_type),
                                mr: 1
                              }}
                            />
                            <Typography variant="body2" fontWeight="medium">
                              {order.fuel_type}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${order.quantity_liters.toLocaleString()} L`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(order.unit_price)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {formatCurrency(order.total_cost)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {order.supplier_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {order.received_by}
                            </Typography>
                          </Box>
                          {order.delivery_note && (
                            <Tooltip title={order.delivery_note}>
                              <ShippingIcon sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }} />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenViewDialog(order)}
                              color="info"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(order)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(order._id)}
                              color="error"
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

        {tabValue === 1 && statistics && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  {chartData ? (
                    <Line data={chartData} options={chartOptions} height={100} />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Fuel Type Distribution
                  </Typography>
                  {statistics.fuelDistribution?.map((fuel, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          {fuel._id}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {fuel.totalLiters.toLocaleString()} L
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            flex: 1,
                            height: 8,
                            bgcolor: 'background.default',
                            borderRadius: 4,
                            mr: 1
                          }}
                        >
                          <Box
                            sx={{
                              width: `${(fuel.totalLiters / statistics.totalLiters) * 100}%`,
                              height: '100%',
                              bgcolor: getFuelColor(fuel._id),
                              borderRadius: 4
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {((fuel.totalLiters / statistics.totalLiters) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {fuel.count} orders
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(fuel.totalCost)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 2 && summaryData && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Daily Order Summary
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Total Orders</TableCell>
                          <TableCell>Total Liters</TableCell>
                          <TableCell>Total Cost</TableCell>
                          <TableCell>Fuel Types</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summaryData.summary?.map((day, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {day._id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={day.dailyOrders}
                                size="small"
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {day.dailyTotalLiters.toLocaleString()} L
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(day.dailyTotalCost)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {day.fuelTypes?.map((fuel, idx) => (
                                  <Chip
                                    key={idx}
                                    label={`${fuel.fuel_type}: ${fuel.totalLiters.toLocaleString()}L`}
                                    size="small"
                                    sx={{ 
                                      bgcolor: getFuelColor(fuel.fuel_type),
                                      color: 'white'
                                    }}
                                  />
                                ))}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Suppliers
                  </Typography>
                  <Grid container spacing={2}>
                    {summaryData.topSuppliers?.map((supplier, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {supplier._id || 'Unknown Supplier'}
                          </Typography>
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                Orders:
                              </Typography>
                              <Typography variant="body2">
                                {supplier.totalOrders}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                Total Liters:
                              </Typography>
                              <Typography variant="body2">
                                {supplier.totalLiters.toLocaleString()} L
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                Total Cost:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(supplier.totalCost)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Order Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editMode ? 'Edit Fuel Order' : 'Record New Fuel Order'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Fuel Type *"
                    name="fuel_type"
                    value={currentOrder.fuel_type}
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
                    label="Quantity (Liters) *"
                    name="quantity_liters"
                    type="number"
                    value={currentOrder.quantity_liters}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      endAdornment: <Typography sx={{ ml: 1 }}>L</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Unit Price ($) *"
                    name="unit_price"
                    type="number"
                    value={currentOrder.unit_price}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Supplier Name *"
                    name="supplier_name"
                    value={currentOrder.supplier_name}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Received By *"
                    name="received_by"
                    value={currentOrder.received_by}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Delivery Note"
                    name="delivery_note"
                    value={currentOrder.delivery_note}
                    onChange={handleInputChange}
                    margin="normal"
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: <ShippingIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    name="remarks"
                    value={currentOrder.remarks}
                    onChange={handleInputChange}
                    margin="normal"
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Total Cost: {formatCurrency(currentOrder.quantity_liters * currentOrder.unit_price)}
                    </Typography>
                    {editMode && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        Note: Updating this order will adjust the fuel stock automatically.
                      </Typography>
                    )}
                  </Alert>
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

        {/* View Order Dialog */}
        <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
          {viewOrder && (
            <>
              <DialogTitle>
                Fuel Order Details
              </DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: getFuelColor(viewOrder.fuel_type) + '20', mb: 2 }}>
                        <Typography variant="h6" align="center" gutterBottom>
                          {viewOrder.fuel_type}
                        </Typography>
                        <Typography variant="h4" align="center" fontWeight="bold">
                          {viewOrder.quantity_liters.toLocaleString()} L
                        </Typography>
                        <Typography variant="body1" align="center" color="text.secondary">
                          {formatCurrency(viewOrder.total_cost)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Order Date:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(viewOrder.date_received)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Unit Price:
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(viewOrder.unit_price)} per liter
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Supplier:
                        </Typography>
                        <Typography variant="body2">
                          {viewOrder.supplier_name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Received By:
                        </Typography>
                        <Typography variant="body2">
                          {viewOrder.received_by}
                        </Typography>
                      </Box>
                      {viewOrder.delivery_note && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Delivery Note:
                          </Typography>
                          <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
                            <Typography variant="body2">
                              {viewOrder.delivery_note}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                      {viewOrder.remarks && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Remarks:
                          </Typography>
                          <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
                            <Typography variant="body2">
                              {viewOrder.remarks}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseViewDialog}>Close</Button>
                <Button 
                  onClick={() => {
                    handleCloseViewDialog();
                    handleOpenDialog(viewOrder);
                  }}
                  variant="contained"
                  color="primary"
                >
                  Edit Order
                </Button>
              </DialogActions>
            </>
          )}
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
    </LocalizationProvider>
  );
};

export default FuelOrderHistory;