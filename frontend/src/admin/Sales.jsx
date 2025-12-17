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
  Badge,
  InputAdornment,
  LinearProgress,
  Divider,
  Autocomplete,
  CardActionArea,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  LocalGasStation as FuelIcon,
  Speed as PumpIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Today as TodayIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  BarChart as ChartIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  CreditCard as CreditCardIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const Sale = () => {
  const [sales, setSales] = useState([]);
  const [stations, setStations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openQuickSaleDialog, setOpenQuickSaleDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSale, setCurrentSale] = useState({
    atendentID: '',
    fuelType: '',
    pumpNo: '',
    unitPrice: 0,
    preRead: 0,
    curRead: 0,
    ltrSold: 0,
    amount: 0,
    payment_method: 'cash',
    entry_method: 'manual',
    tax: 0,
    sales_ref: '',
    stationID: '',
    customer_id: ''
  });
  const [quickSale, setQuickSale] = useState({
    fuelType: '',
    liters: 0,
    unitPrice: 0,
    amount: 0,
    payment_method: 'cash',
    pumpNo: '1'
  });
  const [viewSale, setViewSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [stationFilter, setStationFilter] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  const [statistics, setStatistics] = useState(null);
  const [todaySales, setTodaySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [reportData, setReportData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [selectedFuel, setSelectedFuel] = useState(null);

  // Fetch sales
  const fetchSales = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        ...(startDate && { startDate: startDate.toISOString().split('T')[0] }),
        ...(endDate && { endDate: endDate.toISOString().split('T')[0] }),
        ...(stationFilter && { stationID: stationFilter }),
        ...(fuelFilter && { fuelType: fuelFilter }),
        ...(paymentFilter && { payment_method: paymentFilter }),
        sortBy,
        sortOrder
      };

      const response = await axios.get('http://localhost:5000/api/sales', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setSales(response.data.data);
        setPagination(response.data.pagination);
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
          
          // Prepare chart data
          prepareChartData(response.data.statistics);
        }
      }
    } catch (error) {
      showAlert('Error fetching sales', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stations
  const fetchStations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/stations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 1, limit: 100 }
      });
      if (response.data.success) {
        setEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/customers', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 1, limit: 100 }
      });
      if (response.data.success) {
        setCustomers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch fuels
  const fetchFuels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/fuels', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 1, limit: 100 }
      });
      if (response.data.success) {
        setFuels(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching fuels:', error);
    }
  };

  // Fetch today's sales
  const fetchTodaysSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/sales/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTodaySales(response.data.data);
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
        }
      }
    } catch (error) {
      console.error('Error fetching today\'s sales:', error);
    }
  };

  // Fetch sales report
  const fetchSalesReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        startDate: startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        groupBy: 'day'
      };

      const response = await axios.get('http://localhost:5000/api/sales/report', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sales report:', error);
    }
  };

  const prepareChartData = (stats) => {
    if (stats.dailySales) {
      const labels = stats.dailySales.map(s => s._id.date).reverse();
      const litersData = stats.dailySales.map(s => s.liters).reverse();
      const amountData = stats.dailySales.map(s => s.amount).reverse();

      setChartData({
        labels,
        datasets: [
          {
            label: 'Liters Sold',
            data: litersData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            yAxisID: 'y',
            fill: true
          },
          {
            label: 'Revenue ($)',
            data: amountData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            yAxisID: 'y1',
            fill: true
          }
        ]
      });
    }
  };

  useEffect(() => {
    fetchSales();
    fetchStations();
    fetchEmployees();
    fetchCustomers();
    fetchFuels();
    fetchTodaysSales();
  }, [searchTerm, startDate, endDate, stationFilter, fuelFilter, paymentFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (tabValue === 3) {
      fetchSalesReport();
    }
  }, [tabValue, startDate, endDate]);

  const handleOpenDialog = (sale = null) => {
    if (sale) {
      setCurrentSale({
        ...sale,
        atendentID: sale.atendentID?._id || sale.atendentID,
        stationID: sale.stationID?._id || sale.stationID,
        customer_id: sale.customer_id?._id || sale.customer_id
      });
      setEditMode(true);
    } else {
      setCurrentSale({
        atendentID: '',
        fuelType: '',
        pumpNo: '',
        unitPrice: 0,
        preRead: 0,
        curRead: 0,
        ltrSold: 0,
        amount: 0,
        payment_method: 'cash',
        entry_method: 'manual',
        tax: 0,
        sales_ref: '',
        stationID: '',
        customer_id: ''
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleOpenQuickSaleDialog = () => {
    setQuickSale({
      fuelType: '',
      liters: 0,
      unitPrice: 0,
      amount: 0,
      payment_method: 'cash',
      pumpNo: '1'
    });
    setSelectedFuel(null);
    setOpenQuickSaleDialog(true);
  };

  const handleOpenViewDialog = (sale) => {
    setViewSale(sale);
    setOpenViewDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentSale({
      atendentID: '',
      fuelType: '',
      pumpNo: '',
      unitPrice: 0,
      preRead: 0,
      curRead: 0,
      ltrSold: 0,
      amount: 0,
      payment_method: 'cash',
      entry_method: 'manual',
      tax: 0,
      sales_ref: '',
      stationID: '',
      customer_id: ''
    });
  };

  const handleCloseQuickSaleDialog = () => {
    setOpenQuickSaleDialog(false);
    setQuickSale({
      fuelType: '',
      liters: 0,
      unitPrice: 0,
      amount: 0,
      payment_method: 'cash',
      pumpNo: '1'
    });
    setSelectedFuel(null);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewSale(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSale(prev => {
      const updated = { ...prev, [name]: value };
      
      // Calculate liters and amount if readings changed
      if (name === 'preRead' || name === 'curRead' || name === 'unitPrice') {
        const preRead = name === 'preRead' ? parseFloat(value) : parseFloat(prev.preRead);
        const curRead = name === 'curRead' ? parseFloat(value) : parseFloat(prev.curRead);
        const unitPrice = name === 'unitPrice' ? parseFloat(value) : parseFloat(prev.unitPrice);
        
        if (curRead > preRead) {
          const ltrSold = curRead - preRead;
          const amount = ltrSold * unitPrice;
          updated.ltrSold = ltrSold;
          updated.amount = amount;
        }
      }
      
      return updated;
    });
  };

  const handleQuickSaleChange = (e) => {
    const { name, value } = e.target;
    setQuickSale(prev => {
      const updated = { ...prev, [name]: value };
      
      // Calculate amount if liters or price changed
      if (name === 'liters' || name === 'unitPrice') {
        const liters = name === 'liters' ? parseFloat(value) : parseFloat(prev.liters);
        const unitPrice = name === 'unitPrice' ? parseFloat(value) : parseFloat(prev.unitPrice);
        const amount = liters * unitPrice;
        updated.amount = amount;
      }
      
      return updated;
    });
  };

  const handleFuelSelect = (fuel) => {
    setSelectedFuel(fuel);
    setQuickSale(prev => ({
      ...prev,
      fuelType: fuel.FuelType,
      unitPrice: fuel.UnitPrice
    }));
  };

  const validateForm = () => {
    if (!currentSale.atendentID) {
      showAlert('Atendent is required', 'error');
      return false;
    }
    if (!currentSale.fuelType.trim()) {
      showAlert('Fuel type is required', 'error');
      return false;
    }
    if (!currentSale.pumpNo.trim()) {
      showAlert('Pump number is required', 'error');
      return false;
    }
    if (currentSale.curRead <= currentSale.preRead) {
      showAlert('Current reading must be greater than previous reading', 'error');
      return false;
    }
    if (currentSale.unitPrice <= 0) {
      showAlert('Unit price must be greater than 0', 'error');
      return false;
    }
    if (currentSale.amount <= 0) {
      showAlert('Amount must be greater than 0', 'error');
      return false;
    }
    if (!currentSale.stationID) {
      showAlert('Station is required', 'error');
      return false;
    }
    return true;
  };

  const validateQuickSale = () => {
    if (!quickSale.fuelType.trim()) {
      showAlert('Fuel type is required', 'error');
      return false;
    }
    if (quickSale.liters <= 0) {
      showAlert('Liters must be greater than 0', 'error');
      return false;
    }
    if (quickSale.unitPrice <= 0) {
      showAlert('Unit price must be greater than 0', 'error');
      return false;
    }
    if (quickSale.amount <= 0) {
      showAlert('Amount must be greater than 0', 'error');
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
          `http://localhost:5000/api/sales/${currentSale._id}`,
          currentSale,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          'http://localhost:5000/api/sales',
          currentSale,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        showAlert(
          editMode ? 'Sale updated successfully!' : 'Sale recorded successfully!',
          'success'
        );
        fetchSales();
        fetchTodaysSales();
        handleCloseDialog();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving sale', 'error');
    }
  };

  const handleQuickSaleSubmit = async () => {
    if (!validateQuickSale()) return;

    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      const saleData = {
        atendentID: currentUser?._id || employees[0]?._id,
        fuelType: quickSale.fuelType,
        pumpNo: quickSale.pumpNo,
        unitPrice: quickSale.unitPrice,
        preRead: 0,
        curRead: quickSale.liters,
        ltrSold: quickSale.liters,
        amount: quickSale.amount,
        payment_method: quickSale.payment_method,
        entry_method: 'quick',
        tax: 0,
        stationID: stations[0]?._id,
        customer_id: ''
      };

      const response = await axios.post(
        'http://localhost:5000/api/sales',
        saleData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert('Sale recorded successfully!', 'success');
        fetchSales();
        fetchTodaysSales();
        handleCloseQuickSaleDialog();
        
        // Print receipt
        printReceipt(response.data.data);
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error recording sale', 'error');
    }
  };

  const printReceipt = (saleData) => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${saleData.transaction_no}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { width: 300px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h2 { margin: 0; }
            .details { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>FUEL STATION</h2>
              <p>Receipt</p>
            </div>
            <div class="details">
              <div class="row">
                <span>Transaction #:</span>
                <span>${saleData.transaction_no}</span>
              </div>
              <div class="row">
                <span>Date:</span>
                <span>${new Date(saleData.created_at).toLocaleDateString()}</span>
              </div>
              <div class="row">
                <span>Time:</span>
                <span>${new Date(saleData.created_at).toLocaleTimeString()}</span>
              </div>
              <div class="row">
                <span>Fuel Type:</span>
                <span>${saleData.fuelType}</span>
              </div>
              <div class="row">
                <span>Pump No:</span>
                <span>${saleData.pumpNo}</span>
              </div>
              <div class="row">
                <span>Liters:</span>
                <span>${saleData.ltrSold.toFixed(2)} L</span>
              </div>
              <div class="row">
                <span>Price/Liter:</span>
                <span>$${saleData.unitPrice.toFixed(2)}</span>
              </div>
              <div class="row total">
                <span>Total Amount:</span>
                <span>$${saleData.amount.toFixed(2)}</span>
              </div>
              <div class="row">
                <span>Payment Method:</span>
                <span>${saleData.payment_method}</span>
              </div>
              <div class="row">
                <span>Atendent:</span>
                <span>${saleData.atendentID?.Name || 'N/A'}</span>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Please keep this receipt for your records</p>
            </div>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `http://localhost:5000/api/sales/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          showAlert('Sale deleted successfully!', 'success');
          fetchSales();
          fetchTodaysSales();
        }
      } catch (error) {
        showAlert(error.response?.data?.message || 'Error deleting sale', 'error');
      }
    }
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
    fetchSales(value);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setStationFilter('');
    setFuelFilter('');
    setPaymentFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        ...(startDate && { startDate: startDate.toISOString().split('T')[0] }),
        ...(endDate && { endDate: endDate.toISOString().split('T')[0] }),
        ...(stationFilter && { stationID: stationFilter })
      };

      const response = await axios.get('http://localhost:5000/api/sales/export', {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showAlert('Export completed successfully!', 'success');
    } catch (error) {
      showAlert('Error exporting data', 'error');
    }
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

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getPaymentColor = (method) => {
    const colors = {
      'cash': 'success',
      'card': 'primary',
      'mobile': 'info',
      'credit': 'warning',
      'wallet': 'secondary'
    };
    return colors[method] || 'default';
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
        text: 'Sales Trend'
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
          text: 'Revenue ($)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Floating Action Button for Quick Sale
  const QuickSaleFab = () => (
    <Fab
      color="primary"
      aria-label="quick sale"
      sx={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 1000
      }}
      onClick={handleOpenQuickSaleDialog}
    >
      <QrCodeIcon />
    </Fab>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 3 }}>
          Sales Management
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Sales" />
            <Tab label="Today's Sales" />
            <Tab label="Dashboard" />
            <Tab label="Reports" />
          </Tabs>
        </Box>

        {/* Statistics Cards */}
        {statistics && tabValue !== 3 && (
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
                        Total Sales
                      </Typography>
                      <Typography variant="h5">
                        {statistics.totalSales?.toLocaleString() || 0}
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
                        {statistics.totalLiters?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0} L
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
                        Total Revenue
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(statistics.totalAmount || 0)}
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
                        Avg Sale
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(statistics.totalAmount / (statistics.totalSales || 1) || 0)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Search and Filter Bar */}
        {tabValue !== 2 && tabValue !== 3 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search sales..."
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
                  <InputLabel>Station</InputLabel>
                  <Select
                    value={stationFilter}
                    onChange={(e) => setStationFilter(e.target.value)}
                    label="Station"
                  >
                    <MenuItem value="">All Stations</MenuItem>
                    {stations.map((station) => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    label="Payment Method"
                  >
                    <MenuItem value="">All Methods</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="mobile">Mobile</MenuItem>
                    <MenuItem value="credit">Credit</MenuItem>
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
                  New Sale
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
                  Showing {sales.length} of {pagination.totalItems} sales
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Content based on selected tab */}
        {tabValue === 0 && (
          <>
            {/* Sales Table */}
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
                          active={sortBy === 'transaction_no'}
                          direction={sortOrder}
                          onClick={() => handleSort('transaction_no')}
                        >
                          Transaction #
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'created_at'}
                          direction={sortOrder}
                          onClick={() => handleSort('created_at')}
                        >
                          Date & Time
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Fuel Type</TableCell>
                      <TableCell>Liters</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Atendent</TableCell>
                      <TableCell>Station</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {sale.transaction_no}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pump: {sale.pumpNo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(sale.created_at)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(sale.created_at).toLocaleTimeString([], { 
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
                                bgcolor: getFuelColor(sale.fuelType),
                                mr: 1
                              }}
                            />
                            <Typography variant="body2">
                              {sale.fuelType}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            ${sale.unitPrice.toFixed(2)}/L
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {sale.ltrSold.toFixed(2)} L
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium" color="primary">
                            {formatCurrency(sale.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sale.payment_method || 'cash'}
                            color={getPaymentColor(sale.payment_method)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {sale.atendentID?.Name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {sale.stationID?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sale.stationID?.location}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenViewDialog(sale)}
                              color="info"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(sale)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(sale._id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Receipt">
                            <IconButton
                              size="small"
                              onClick={() => printReceipt(sale)}
                              color="success"
                            >
                              <PrintIcon />
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
          <>
            {/* Today's Sales Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Today's Sales - {new Date().toLocaleDateString()}
              </Typography>
              {statistics?.overallStats && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {statistics.overallStats.totalSales}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Transactions
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success">
                        {statistics.overallStats.totalLiters?.toFixed(0)} L
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fuel Sold
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning">
                        {formatCurrency(statistics.overallStats.totalAmount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Box>

            {/* Today's Sales Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Transaction #</TableCell>
                    <TableCell>Fuel Type</TableCell>
                    <TableCell>Liters</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Atendent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todaySales.map((sale) => (
                    <TableRow key={sale._id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(sale.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {sale.transaction_no}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: getFuelColor(sale.fuelType),
                              mr: 1
                            }}
                          />
                          <Typography variant="body2">
                            {sale.fuelType}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1">
                          {sale.ltrSold.toFixed(2)} L
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium" color="primary">
                          {formatCurrency(sale.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sale.payment_method || 'cash'}
                          color={getPaymentColor(sale.payment_method)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {sale.atendentID?.Name || 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Today's Statistics */}
            {statistics && (
              <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Fuel Sales Today
                      </Typography>
                      {statistics.fuelSales?.map((fuel, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {fuel._id}
                            </Typography>
                            <Typography variant="body2">
                              {fuel.liters?.toFixed(0)} L
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(fuel.liters / (statistics.fuelSales.reduce((sum, f) => sum + f.liters, 0) || 1)) * 100}
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: getFuelColor(fuel._id) + '20'
                            }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {fuel.sales} sales
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(fuel.amount)}
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
                        Payment Methods
                      </Typography>
                      {statistics.paymentStats?.map((payment, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {payment._id?.toUpperCase() || 'UNKNOWN'}
                            </Typography>
                            <Typography variant="body2">
                              {payment.sales} sales
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(payment.amount / (statistics.paymentStats.reduce((sum, p) => sum + p.amount, 0) || 1)) * 100}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(payment.amount)}
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            {/* Sales Chart */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sales Overview
                  </Typography>
                  {chartData ? (
                    <Line data={chartData} options={chartOptions} height={80} />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Top Selling Fuels */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Selling Fuels
                  </Typography>
                  {statistics?.topFuels?.map((fuel, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ 
                          bgcolor: getFuelColor(fuel._id),
                          width: 32,
                          height: 32,
                          mr: 2
                        }}>
                          <FuelIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1">
                            {fuel._id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fuel.transactions} sales
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {fuel.liters?.toFixed(0)} L
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(fuel.amount)}
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(fuel.liters / (statistics.topFuels[0]?.liters || 1)) * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Sales */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Sales
                  </Typography>
                  {sales.slice(0, 5).map((sale, index) => (
                    <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < 4 ? '1px solid' : 'none', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {sale.transaction_no}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(sale.created_at)}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium" color="primary">
                          {formatCurrency(sale.amount)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Chip
                          label={sale.fuelType}
                          size="small"
                          sx={{ bgcolor: getFuelColor(sale.fuelType), color: 'white' }}
                        />
                        <Chip
                          label={sale.payment_method || 'cash'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 3 && reportData && (
          <Grid container spacing={3}>
            {/* Report Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sales Report Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {reportData.summary?.totalPeriods}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Days
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success">
                          {reportData.summary?.totalSales?.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Sales
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning">
                          {reportData.summary?.totalLiters?.toLocaleString()} L
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Liters
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="error">
                          {formatCurrency(reportData.summary?.totalAmount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Revenue
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Detailed Report */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Daily Sales Report
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Transactions</TableCell>
                          <TableCell>Liters Sold</TableCell>
                          <TableCell>Revenue</TableCell>
                          <TableCell>Tax</TableCell>
                          <TableCell>Avg Sale</TableCell>
                          <TableCell>Customers</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.report?.map((day, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2">
                                {day.period}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {day.totalSales}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {day.totalLiters?.toFixed(0)} L
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(day.totalAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatCurrency(day.totalTax)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatCurrency(day.avgSaleAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {day.customerCount}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Products */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Products
                  </Typography>
                  {reportData.topProducts?.map((product, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          {product._id}
                        </Typography>
                        <Typography variant="body2">
                          {product.liters?.toFixed(0)} L
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(product.liters / (reportData.topProducts[0]?.liters || 1)) * 100}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: getFuelColor(product._id) + '20'
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {product.sales} sales
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(product.amount)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Top Stations */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Stations
                  </Typography>
                  {reportData.topStations?.map((station, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {station._id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {station.location}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Sales:
                          </Typography>
                          <Typography variant="body2">
                            {station.sales}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Liters:
                          </Typography>
                          <Typography variant="body2">
                            {station.liters?.toFixed(0)} L
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Revenue:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(station.amount)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Sale Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editMode ? 'Edit Sale' : 'Record New Sale'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Atendent *</InputLabel>
                    <Select
                      name="atendentID"
                      value={currentSale.atendentID}
                      onChange={handleInputChange}
                      label="Atendent *"
                      required
                    >
                      <MenuItem value="" disabled>Select Atendent</MenuItem>
                      {employees.map((employee) => (
                        <MenuItem key={employee._id} value={employee._id}>
                          {employee.Name} - {employee.Email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Station *</InputLabel>
                    <Select
                      name="stationID"
                      value={currentSale.stationID}
                      onChange={handleInputChange}
                      label="Station *"
                      required
                    >
                      <MenuItem value="" disabled>Select Station</MenuItem>
                      {stations.map((station) => (
                        <MenuItem key={station._id} value={station._id}>
                          {station.name} - {station.location}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Fuel Type *"
                    name="fuelType"
                    value={currentSale.fuelType}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: <FuelIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Pump Number *"
                    name="pumpNo"
                    value={currentSale.pumpNo}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: <PumpIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Unit Price ($) *"
                    name="unitPrice"
                    type="number"
                    value={currentSale.unitPrice}
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
                    label="Previous Reading"
                    name="preRead"
                    type="number"
                    value={currentSale.preRead}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Current Reading *"
                    name="curRead"
                    type="number"
                    value={currentSale.curRead}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Liters Sold"
                    name="ltrSold"
                    type="number"
                    value={currentSale.ltrSold}
                    onChange={handleInputChange}
                    margin="normal"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Amount ($)"
                    name="amount"
                    type="number"
                    value={currentSale.amount}
                    onChange={handleInputChange}
                    margin="normal"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      name="payment_method"
                      value={currentSale.payment_method}
                      onChange={handleInputChange}
                      label="Payment Method"
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                      <MenuItem value="mobile">Mobile Payment</MenuItem>
                      <MenuItem value="credit">Credit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Customer</InputLabel>
                    <Select
                      name="customer_id"
                      value={currentSale.customer_id}
                      onChange={handleInputChange}
                      label="Customer"
                    >
                      <MenuItem value="">Walk-in Customer</MenuItem>
                      {customers.map((customer) => (
                        <MenuItem key={customer._id} value={customer._id}>
                          {customer.name} - {customer.phone}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tax ($)"
                    name="tax"
                    type="number"
                    value={currentSale.tax}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sales Reference"
                    name="sales_ref"
                    value={currentSale.sales_ref}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Calculated Values: {currentSale.ltrSold.toFixed(2)} L × ${currentSale.unitPrice.toFixed(2)} = {formatCurrency(currentSale.amount)}
                    </Typography>
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

        {/* Quick Sale Dialog */}
        <Dialog open={openQuickSaleDialog} onClose={handleCloseQuickSaleDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Quick Sale
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select Fuel Type
                  </Typography>
                  <Grid container spacing={1}>
                    {fuels.map((fuel) => (
                      <Grid item xs={6} sm={4} key={fuel._id}>
                        <CardActionArea onClick={() => handleFuelSelect(fuel)}>
                          <Card 
                            sx={{ 
                              p: 2, 
                              textAlign: 'center',
                              border: selectedFuel?._id === fuel._id ? '2px solid' : '1px solid',
                              borderColor: selectedFuel?._id === fuel._id ? 'primary.main' : 'divider',
                              bgcolor: selectedFuel?._id === fuel._id ? 'primary.50' : 'background.paper'
                            }}
                          >
                            <FuelIcon sx={{ 
                              fontSize: 40, 
                              color: getFuelColor(fuel.FuelType),
                              mb: 1
                            }} />
                            <Typography variant="body1" fontWeight="medium">
                              {fuel.FuelType}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ${fuel.UnitPrice}/L
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fuel.AvailableLiters?.toLocaleString()} L available
                            </Typography>
                          </Card>
                        </CardActionArea>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
                {selectedFuel && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Liters"
                        name="liters"
                        type="number"
                        value={quickSale.liters}
                        onChange={handleQuickSaleChange}
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
                        label="Unit Price ($)"
                        name="unitPrice"
                        type="number"
                        value={quickSale.unitPrice}
                        onChange={handleQuickSaleChange}
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
                        label="Pump Number"
                        name="pumpNo"
                        value={quickSale.pumpNo}
                        onChange={handleQuickSaleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                          name="payment_method"
                          value={quickSale.payment_method}
                          onChange={handleQuickSaleChange}
                          label="Payment Method"
                        >
                          <MenuItem value="cash">Cash</MenuItem>
                          <MenuItem value="card">Card</MenuItem>
                          <MenuItem value="mobile">Mobile Payment</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: 'primary.50', mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">
                            Total Amount
                          </Typography>
                          <Typography variant="h4" color="primary" fontWeight="bold">
                            {formatCurrency(quickSale.amount)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {quickSale.liters} L × ${quickSale.unitPrice}/L
                        </Typography>
                      </Paper>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseQuickSaleDialog}>Cancel</Button>
            <Button 
              onClick={handleQuickSaleSubmit} 
              variant="contained" 
              color="primary"
              disabled={!selectedFuel}
            >
              Complete Sale & Print
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Sale Dialog */}
        <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
          {viewSale && (
            <>
              <DialogTitle>
                Sale Details - {viewSale.transaction_no}
              </DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, bgcolor: 'primary.50', mb: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                          {formatCurrency(viewSale.amount)}
                        </Typography>
                        <Typography variant="body1">
                          {viewSale.ltrSold.toFixed(2)} L of {viewSale.fuelType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @ ${viewSale.unitPrice}/L
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Transaction #:
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {viewSale.transaction_no}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Date & Time:
                          </Typography>
                          <Typography variant="body1">
                            {formatDateTime(viewSale.created_at)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Pump Number:
                          </Typography>
                          <Typography variant="body1">
                            {viewSale.pumpNo}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Payment Method:
                          </Typography>
                          <Chip
                            label={viewSale.payment_method || 'cash'}
                            color={getPaymentColor(viewSale.payment_method)}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Atendent:
                          </Typography>
                          <Typography variant="body1">
                            {viewSale.atendentID?.Name || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Station:
                          </Typography>
                          <Typography variant="body1">
                            {viewSale.stationID?.name || 'N/A'}
                          </Typography>
                        </Grid>
                        {viewSale.customer_id && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Customer:
                            </Typography>
                            <Typography variant="body1">
                              {viewSale.customer_id?.name} ({viewSale.customer_id?.phone})
                            </Typography>
                          </Grid>
                        )}
                        {viewSale.sales_ref && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Reference:
                            </Typography>
                            <Typography variant="body1">
                              {viewSale.sales_ref}
                            </Typography>
                          </Grid>
                        )}
                        {viewSale.tax > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Tax:
                            </Typography>
                            <Typography variant="body1">
                              {formatCurrency(viewSale.tax)}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseViewDialog}>Close</Button>
                <Button 
                  onClick={() => {
                    handleCloseViewDialog();
                    handleOpenDialog(viewSale);
                  }}
                  variant="contained"
                  color="primary"
                >
                  Edit Sale
                </Button>
                <Button 
                  onClick={() => printReceipt(viewSale)}
                  variant="outlined"
                  startIcon={<PrintIcon />}
                >
                  Print Receipt
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

        {/* Quick Sale FAB */}
        <QuickSaleFab />
      </Container>
    </LocalizationProvider>
  );
};

export default Sale;