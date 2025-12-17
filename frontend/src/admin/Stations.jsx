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
  Rating,
  CardActionArea,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as StationIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  People as PeopleIcon,
  LocalGasStation as PumpIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Map as MapIcon,
  Store as StoreIcon,
  Assignment as AssignmentIcon,
  Print as PrintIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
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
  Filler,
  ArcElement
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
  Filler,
  ArcElement
);

const Station = () => {
  const [stations, setStations] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStation, setCurrentStation] = useState({
    Name: '',
    Location: '',
    ContactNumber: '',
    status: '1'
  });
  const [viewStation, setViewStation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('Name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  const [statistics, setStatistics] = useState(null);
  const [stationStats, setStationStats] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [selectedStationForAssign, setSelectedStationForAssign] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [inventoryData, setInventoryData] = useState([]);
  const [chartData, setChartData] = useState(null);

  // Fetch stations
  const fetchStations = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        ...(statusFilter && { status: statusFilter }),
        sortBy,
        sortOrder
      };

      const response = await axios.get('/api/stations', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setStations(response.data.data);
        setPagination(response.data.pagination);
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
        }
      }
    } catch (error) {
      showAlert('Error fetching stations', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch station statistics
  const fetchStationStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/stations/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStationStats(response.data.data);
        
        // Prepare chart data
        if (response.data.data.topStations) {
          prepareChartData(response.data.data.topStations);
        }
      }
    } catch (error) {
      console.error('Error fetching station stats:', error);
    }
  };

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/stations/performance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPerformanceData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  // Fetch employees for assignment
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          status: 1, 
          limit: 100,
          role: 'station_manager' 
        }
      });
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch station inventory
  const fetchStationInventory = async (stationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/stations/${stationId}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setInventoryData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching station inventory:', error);
    }
  };

  const prepareChartData = (topStations) => {
    const labels = topStations.map(station => station.stationName);
    const revenueData = topStations.map(station => station.totalRevenue);
    const salesData = topStations.map(station => station.totalSales);

    setChartData({
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Revenue ($)',
          data: revenueData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Sales Count',
          data: salesData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
          yAxisID: 'y1'
        }
      ]
    });
  };

  useEffect(() => {
    fetchStations();
    fetchStationStats();
    fetchEmployees();
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (tabValue === 2) {
      fetchPerformanceData();
    }
  }, [tabValue]);

  const handleOpenDialog = (station = null) => {
    if (station) {
      setCurrentStation(station);
      setEditMode(true);
    } else {
      setCurrentStation({
        Name: '',
        Location: '',
        ContactNumber: '',
        status: '1'
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleOpenViewDialog = async (station) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/stations/${station._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setViewStation(response.data.data);
        setOpenViewDialog(true);
      }
    } catch (error) {
      showAlert('Error loading station details', 'error');
    }
  };

  const handleOpenAssignDialog = (station) => {
    setSelectedStationForAssign(station);
    setSelectedEmployee('');
    setOpenAssignDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentStation({
      Name: '',
      Location: '',
      ContactNumber: '',
      status: '1'
    });
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewStation(null);
  };

  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setSelectedStationForAssign(null);
    setSelectedEmployee('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentStation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!currentStation.Name.trim()) {
      showAlert('Station name is required', 'error');
      return false;
    }
    if (!currentStation.Location.trim()) {
      showAlert('Location is required', 'error');
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
          `/api/stations/${currentStation._id}`,
          currentStation,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          '/api/stations',
          currentStation,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        showAlert(
          editMode ? 'Station updated successfully!' : 'Station created successfully!',
          'success'
        );
        fetchStations();
        fetchStationStats();
        handleCloseDialog();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving station', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `/api/stations/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          showAlert('Station deleted successfully!', 'success');
          fetchStations();
          fetchStationStats();
        }
      } catch (error) {
        showAlert(error.response?.data?.message || 'Error deleting station', 'error');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/stations/${id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        fetchStations();
        fetchStationStats();
      }
    } catch (error) {
      showAlert('Error updating station status', 'error');
    }
  };

  const handleAssignManager = async () => {
    if (!selectedEmployee) {
      showAlert('Please select an employee', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/stations/${selectedStationForAssign._id}/assign-manager/${selectedEmployee}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert('Manager assigned successfully!', 'success');
        handleCloseAssignDialog();
        fetchStations();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error assigning manager', 'error');
    }
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
    fetchStations(value);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSortBy('Name');
    setSortOrder('asc');
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/stations/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stations_${new Date().toISOString().split('T')[0]}.csv`);
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

  const getStationColor = (status) => {
    return status === "1" ? 'success' : 'default';
  };

  const getStationIcon = (status) => {
    return status === "1" ? <ActiveIcon /> : <InactiveIcon />;
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency > 100) return 'success';
    if (efficiency > 50) return 'warning';
    return 'error';
  };

  const getEfficiencyLabel = (efficiency) => {
    if (efficiency > 100) return 'High';
    if (efficiency > 50) return 'Medium';
    return 'Low';
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Revenue ($)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Sales Count'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const handleViewInventory = async (stationId) => {
    await fetchStationInventory(stationId);
    setTabValue(3); // Switch to inventory tab
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 3 }}>
        Station Management
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Stations" />
          <Tab label="Dashboard" />
          <Tab label="Performance" />
          <Tab label="Inventory" />
        </Tabs>
      </Box>

      {/* Statistics Cards - Show on All Stations tab */}
      {tabValue === 0 && statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <StationIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Stations
                    </Typography>
                    <Typography variant="h5">
                      {statistics.totalStations}
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
                    <ActiveIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Active Stations
                    </Typography>
                    <Typography variant="h5">
                      {statistics.activeStations}
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
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Employees
                    </Typography>
                    <Typography variant="h5">
                      {statistics.totalEmployees}
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
                    <PumpIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Pumps
                    </Typography>
                    <Typography variant="h5">
                      {statistics.totalPumps}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filter Bar - Hide on Dashboard and Inventory tabs */}
      {tabValue !== 1 && tabValue !== 3 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search stations..."
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
            <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                New Station
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
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<FilterIcon />}
                sx={{ ml: 2 }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Content based on selected tab */}
      {tabValue === 0 && (
        <>
          {/* Stations Table */}
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
                        active={sortBy === 'Name'}
                        direction={sortOrder}
                        onClick={() => handleSort('Name')}
                      >
                        Station Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'status'}
                        direction={sortOrder}
                        onClick={() => handleSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Employees</TableCell>
                    <TableCell>Pumps</TableCell>
                    <TableCell>Today's Sales</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            mr: 2, 
                            bgcolor: station.status === "1" ? 'primary.main' : 'grey.400'
                          }}>
                            <StationIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {station.Name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {station._id.toString().slice(-6)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {station.Location}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {station.ContactNumber ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {station.ContactNumber}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not set
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={station.status === "1" ? 'Active' : 'Inactive'}
                          color={getStationColor(station.status)}
                          size="small"
                          icon={getStationIcon(station.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PeopleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {station.employeeCount || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PumpIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {station.pumpCount || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {station.todaySales > 0 ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {station.todaySales} sales
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(station.todayRevenue || 0)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No sales today
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenViewDialog(station)}
                            color="info"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(station)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={station.status === "1" ? "Deactivate" : "Activate"}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(station._id, station.status)}
                            color={station.status === "1" ? "default" : "success"}
                          >
                            {station.status === "1" ? <InactiveIcon /> : <ActiveIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Assign Manager">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenAssignDialog(station)}
                            color="warning"
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Inventory">
                          <IconButton
                            size="small"
                            onClick={() => handleViewInventory(station._id)}
                            color="secondary"
                          >
                            <InventoryIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(station._id)}
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

      {tabValue === 1 && stationStats && (
        <Grid container spacing={3}>
          {/* Dashboard Header */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Station Dashboard Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {stationStats.totalStations}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Stations
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success">
                        {stationStats.activeStations}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Stations
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning">
                        {stationStats.inactiveStations}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Inactive Stations
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info">
                        {stationStats.topStations?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Top Performing
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Stations Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Performing Stations
                </Typography>
                {chartData ? (
                  <Bar data={chartData} options={chartOptions} height={100} />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Status Distribution */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Station Status Distribution
                </Typography>
                {stationStats.statusDistribution?.map((status, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {status._id === "1" ? 'Active' : 'Inactive'}
                      </Typography>
                      <Typography variant="body2">
                        {status.count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(status.count / stationStats.totalStations) * 100}
                      color={status._id === "1" ? "success" : "default"}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {((status.count / stationStats.totalStations) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Stations List */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top 5 Stations by Revenue
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Station Name</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell>Sales</TableCell>
                        <TableCell>Liters Sold</TableCell>
                        <TableCell>Efficiency</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stationStats.topStations?.map((station, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip
                              label={`#${index + 1}`}
                              color={index === 0 ? "primary" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {station.stationName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {station.location}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium" color="primary">
                              {formatCurrency(station.totalRevenue)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {station.totalSales}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {station.totalLiters?.toLocaleString()} L
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getEfficiencyLabel(station.totalRevenue / station.totalLiters || 0)}
                              color={getEfficiencyColor(station.totalRevenue / station.totalLiters || 0)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && performanceData && (
        <Grid container spacing={3}>
          {/* Performance Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {performanceData.summary?.totalStations}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stations
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success">
                        {performanceData.summary?.totalSales?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Sales
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning">
                        {formatCurrency(performanceData.summary?.totalRevenue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info">
                        {formatCurrency(performanceData.summary?.avgRevenuePerStation)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Revenue/Station
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Station Performance Details
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Station Name</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Total Sales</TableCell>
                        <TableCell>Total Revenue</TableCell>
                        <TableCell>Liters Sold</TableCell>
                        <TableCell>Avg Sale Amount</TableCell>
                        <TableCell>Efficiency ($/L)</TableCell>
                        <TableCell>Fuel Types</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceData.performance?.map((station, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {station.stationName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {station.contactNumber || 'No contact'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {station.location}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={station.status === "1" ? 'Active' : 'Inactive'}
                              color={getStationColor(station.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {station.totalSales}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" color="primary" fontWeight="bold">
                              {formatCurrency(station.totalRevenue)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {station.totalLiters?.toLocaleString()} L
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCurrency(station.avgSaleAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                {station.efficiency?.toFixed(2)}
                              </Typography>
                              <Rating
                                value={Math.min(Math.ceil(station.efficiency / 20), 5)}
                                size="small"
                                readOnly
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {station.fuelTypes?.slice(0, 3).map((fuel, idx) => (
                                <Chip
                                  key={idx}
                                  label={fuel}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                              {station.fuelTypes?.length > 3 && (
                                <Chip
                                  label={`+${station.fuelTypes.length - 3}`}
                                  size="small"
                                />
                              )}
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
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {/* Inventory Header */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Station Inventory
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  View fuel inventory and pump distribution across stations
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<InventoryIcon />}
                  onClick={() => {
                    if (stations.length > 0) {
                      handleViewInventory(stations[0]._id);
                    }
                  }}
                >
                  Load Inventory
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Inventory List */}
          <Grid item xs={12}>
            {inventoryData.length > 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Available Fuels by Station
                  </Typography>
                  <Grid container spacing={2}>
                    {inventoryData.map((fuel, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{ 
                                bgcolor: 'primary.main',
                                mr: 2
                              }}>
                                <PumpIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6">
                                  {fuel.fuelType}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ${fuel.unitPrice}/L
                                </Typography>
                              </Box>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <List dense>
                              <ListItem>
                                <ListItemIcon>
                                  <LocalGasStationIcon />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Total Pumps" 
                                  secondary={fuel.totalPumps}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemIcon>
                                  <CheckCircleIcon />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Active Pumps" 
                                  secondary={fuel.activePumps}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemIcon>
                                  <InventoryIcon />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Available Stock" 
                                  secondary={`${fuel.availableLiters?.toLocaleString()} L`}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemIcon>
                                  <BusinessIcon />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Supplier" 
                                  secondary={fuel.supplier || 'Not specified'}
                                />
                              </ListItem>
                            </List>
                            <Box sx={{ mt: 2 }}>
                              <LinearProgress
                                variant="determinate"
                                value={(fuel.activePumps / fuel.totalPumps) * 100}
                                color={fuel.activePumps === fuel.totalPumps ? "success" : "warning"}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption" color="text.secondary" align="center" display="block">
                                {((fuel.activePumps / fuel.totalPumps) * 100).toFixed(0)}% pumps active
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <InventoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Inventory Data
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Select a station to view its inventory or load inventory data
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    if (stations.length > 0) {
                      handleViewInventory(stations[0]._id);
                    }
                  }}
                >
                  Load Inventory
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      )}

      {/* Station Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Station' : 'Add New Station'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Station Name *"
                  name="Name"
                  value={currentStation.Name}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: <StationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location *"
                  name="Location"
                  value={currentStation.Location}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="ContactNumber"
                  value={currentStation.ContactNumber}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={currentStation.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value="1">Active</MenuItem>
                    <MenuItem value="0">Inactive</MenuItem>
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

      {/* View Station Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="lg" >
        {viewStation && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: viewStation.status === "1" ? 'primary.main' : 'grey.400' }}>
                  <StationIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {viewStation.Name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewStation.Location}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  {/* Station Info */}
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Station Information
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <LocationIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Location" 
                              secondary={viewStation.Location}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <PhoneIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Contact" 
                              secondary={viewStation.ContactNumber || 'Not set'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircleIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Status" 
                              secondary={
                                <Chip
                                  label={viewStation.status === "1" ? 'Active' : 'Inactive'}
                                  color={getStationColor(viewStation.status)}
                                  size="small"
                                />
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <ScheduleIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Created" 
                              secondary={new Date(viewStation.createdAt).toLocaleDateString()}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Statistics */}
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Station Statistics
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4" color="primary">
                                {viewStation.sales.totalSales}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total Sales
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4" color="success">
                                {formatCurrency(viewStation.sales.totalRevenue)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total Revenue
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4" color="warning">
                                {viewStation.sales.totalLiters?.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total Liters
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4" color="info">
                                {viewStation.employees.total}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Employees
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Employees */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">
                            Employees ({viewStation.employees.total})
                          </Typography>
                          <Chip
                            label={`${viewStation.employees.active} active`}
                            color="success"
                            size="small"
                          />
                        </Box>
                        <List dense>
                          {viewStation.employees.list.map((employee, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {employee.Name.charAt(0)}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText 
                                primary={employee.Name}
                                secondary={`${employee.Role} • ${employee.Email}`}
                              />
                              <ListItemSecondaryAction>
                                <Chip
                                  label={employee.status === 1 ? 'Active' : 'Inactive'}
                                  color={employee.status === 1 ? 'success' : 'default'}
                                  size="small"
                                />
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Pumps */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">
                            Pumps ({viewStation.pumps.total})
                          </Typography>
                          <Chip
                            label={`${viewStation.pumps.active} active`}
                            color="success"
                            size="small"
                          />
                        </Box>
                        <List dense>
                          {viewStation.pumps.list.map((pump, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Avatar sx={{ 
                                  width: 32, 
                                  height: 32,
                                  bgcolor: pump.status === 1 ? 'primary.main' : 'grey.400'
                                }}>
                                  <PumpIcon />
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText 
                                primary={pump.pumpName}
                                secondary={`${pump.fuelID?.FuelType || 'N/A'} • $${pump.fuelID?.UnitPrice || '0'}/L`}
                              />
                              <ListItemSecondaryAction>
                                <Chip
                                  label={pump.status === 1 ? 'Active' : 'Inactive'}
                                  color={pump.status === 1 ? 'success' : 'default'}
                                  size="small"
                                />
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Recent Sales */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Recent Sales
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Transaction #</TableCell>
                                <TableCell>Fuel Type</TableCell>
                                <TableCell>Liters</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Payment</TableCell>
                                <TableCell>Atendent</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {viewStation.recentSales.map((sale, index) => (
                                <TableRow key={index} hover>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {new Date(sale.created_at).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(sale.created_at).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {sale.transaction_no}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {sale.fuelType}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {sale.ltrSold.toFixed(2)} L
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="primary" fontWeight="medium">
                                      {formatCurrency(sale.amount)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={sale.payment_method || 'cash'}
                                      size="small"
                                      variant="outlined"
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
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewDialog}>Close</Button>
              <Button 
                onClick={() => {
                  handleCloseViewDialog();
                  handleOpenDialog(viewStation);
                }}
                variant="contained"
                color="primary"
              >
                Edit Station
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Assign Manager Dialog */}
      <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        {selectedStationForAssign && (
          <>
            <DialogTitle>
              Assign Manager to {selectedStationForAssign.Name}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Only station managers and administrators can be assigned as station managers.
                </Alert>
                <FormControl fullWidth>
                  <InputLabel>Select Manager</InputLabel>
                  <Select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    label="Select Manager"
                  >
                    <MenuItem value="" disabled>Choose a manager</MenuItem>
                    {employees.map((employee) => (
                      <MenuItem key={employee._id} value={employee._id}>
                        {employee.Name} - {employee.Role} ({employee.Email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedEmployee && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Selected Manager:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {employees.find(e => e._id === selectedEmployee)?.Name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {employees.find(e => e._id === selectedEmployee)?.Email}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAssignDialog}>Cancel</Button>
              <Button onClick={handleAssignManager} variant="contained" color="primary">
                Assign Manager
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
  );
};

// Add missing icons
const LocalGasStationIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M0 0h24v24H0V0z" fill="none" />
    <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 13.5V19H6v-7h6v1.5zm0-3.5H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);

const CheckCircleIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M0 0h24v24H0z" fill="none" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const BusinessIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M0 0h24v24H0z" fill="none" />
    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
  </svg>
);

const RefreshIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M0 0h24v24H0z" fill="none" />
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
  </svg>
);

export default Station;