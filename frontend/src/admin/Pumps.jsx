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
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LocalGasStation as PumpIcon,
  Build as MaintenanceIcon,
  LocationOn as LocationIcon,
  Whatshot as FuelIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Business as StationIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const Pump = () => {
  const [pumps, setPumps] = useState([]);
  const [stations, setStations] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPump, setCurrentPump] = useState({
    pumpName: '',
    stationID: '',
    fuelID: '',
    status: 1,
    MaintenanceDate: null,
    pumpDesc: ''
  });
  const [viewPump, setViewPump] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  const [statistics, setStatistics] = useState(null);
  const [maintenanceDuePumps, setMaintenanceDuePumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [stationPumps, setStationPumps] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  // Fetch pumps
  const fetchPumps = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        ...(statusFilter && { status: statusFilter }),
        ...(stationFilter && { stationID: stationFilter }),
        ...(fuelFilter && { fuelID: fuelFilter }),
        sortBy,
        sortOrder
      };

      const response = await axios.get('/api/pumps', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setPumps(response.data.data);
        setPagination(response.data.pagination);
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
        }
      }
    } catch (error) {
      showAlert('Error fetching pumps', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stations
  const fetchStations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/stations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  // Fetch fuels
  const fetchFuels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/fuels', {
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

  // Fetch maintenance due pumps
  const fetchMaintenanceDuePumps = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/pumps/maintenance-due', {
        headers: { Authorization: `Bearer ${token}` },
        params: { days: 7 }
      });
      if (response.data.success) {
        setMaintenanceDuePumps(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching maintenance due pumps:', error);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/pumps/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fetch pumps by station
  const fetchPumpsByStation = async (stationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/pumps/station/${stationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStationPumps(response.data.data);
        setSelectedStation(response.data.station);
      }
    } catch (error) {
      console.error('Error fetching station pumps:', error);
    }
  };

  useEffect(() => {
    fetchPumps();
    fetchStations();
    fetchFuels();
    fetchMaintenanceDuePumps();
    fetchStatistics();
  }, [searchTerm, statusFilter, stationFilter, fuelFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (stationFilter && tabValue === 2) {
      fetchPumpsByStation(stationFilter);
    }
  }, [stationFilter, tabValue]);

  const handleOpenDialog = (pump = null) => {
    if (pump) {
      setCurrentPump({
        ...pump,
        stationID: pump.stationID?._id || pump.stationID,
        fuelID: pump.fuelID?._id || pump.fuelID,
        MaintenanceDate: pump.MaintenanceDate ? new Date(pump.MaintenanceDate) : null
      });
      setEditMode(true);
    } else {
      setCurrentPump({
        pumpName: '',
        stationID: '',
        fuelID: '',
        status: 1,
        MaintenanceDate: null,
        pumpDesc: ''
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleOpenViewDialog = (pump) => {
    setViewPump(pump);
    setOpenViewDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPump({
      pumpName: '',
      stationID: '',
      fuelID: '',
      status: 1,
      MaintenanceDate: null,
      pumpDesc: ''
    });
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewPump(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPump(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setCurrentPump(prev => ({
      ...prev,
      MaintenanceDate: date
    }));
  };

  const validateForm = () => {
    if (!currentPump.pumpName.trim()) {
      showAlert('Pump name is required', 'error');
      return false;
    }
    if (!currentPump.stationID) {
      showAlert('Station is required', 'error');
      return false;
    }
    if (!currentPump.fuelID) {
      showAlert('Fuel type is required', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      const pumpData = {
        ...currentPump,
        MaintenanceDate: currentPump.MaintenanceDate || null
      };

      let response;
      if (editMode) {
        response = await axios.put(
          `/api/pumps/${currentPump._id}`,
          pumpData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          '/api/pumps',
          pumpData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        showAlert(
          editMode ? 'Pump updated successfully!' : 'Pump created successfully!',
          'success'
        );
        fetchPumps();
        fetchStatistics();
        fetchMaintenanceDuePumps();
        if (stationFilter) {
          fetchPumpsByStation(stationFilter);
        }
        handleCloseDialog();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving pump', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pump?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `/api/pumps/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          showAlert('Pump deleted successfully!', 'success');
          fetchPumps();
          fetchStatistics();
          fetchMaintenanceDuePumps();
          if (stationFilter) {
            fetchPumpsByStation(stationFilter);
          }
        }
      } catch (error) {
        showAlert(error.response?.data?.message || 'Error deleting pump', 'error');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/pumps/${id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        fetchPumps();
        fetchStatistics();
        fetchMaintenanceDuePumps();
        if (stationFilter) {
          fetchPumpsByStation(stationFilter);
        }
      }
    } catch (error) {
      showAlert('Error updating pump status', 'error');
    }
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
    fetchPumps(value);
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
    setStatusFilter('');
    setStationFilter('');
    setFuelFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isMaintenanceDue = (maintenanceDate) => {
    if (!maintenanceDate) return false;
    const today = new Date();
    const dueDate = new Date(maintenanceDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  };

  const isMaintenanceOverdue = (maintenanceDate) => {
    if (!maintenanceDate) return false;
    const today = new Date();
    const dueDate = new Date(maintenanceDate);
    return dueDate < today;
  };

  const getPumpColor = (status, maintenanceDate) => {
    if (status === 0) return '#9e9e9e'; // Inactive - gray
    if (isMaintenanceOverdue(maintenanceDate)) return '#f44336'; // Overdue - red
    if (isMaintenanceDue(maintenanceDate)) return '#ff9800'; // Due soon - orange
    return '#4caf50'; // Active - green
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 3 }}>
          Pump Management
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Pumps" />
            <Tab label="Maintenance Due" />
            <Tab label="Station View" />
            <Tab label="Statistics" />
          </Tabs>
        </Box>

        {/* Statistics Cards - Show on All Pumps tab */}
        {tabValue === 0 && statistics && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <PumpIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Total Pumps
                      </Typography>
                      <Typography variant="h5">
                        {statistics?.totalPumps || 0}
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
                        Active Pumps
                      </Typography>
                      <Typography variant="h5">
                        {statistics?.activePumps || 0}
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
                      <MaintenanceIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Maintenance Due
                      </Typography>
                      <Typography variant="h5" color="warning.main">
                        {maintenanceDuePumps.length}
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
                      <StationIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Stations
                      </Typography>
                      <Typography variant="h5">
                        {stations.length}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Search and Filter Bar - Hide on Statistics tab */}
        {tabValue !== 3 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search pumps..."
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
                  <InputLabel>Fuel Type</InputLabel>
                  <Select
                    value={fuelFilter}
                    onChange={(e) => setFuelFilter(e.target.value)}
                    label="Fuel Type"
                  >
                    <MenuItem value="">All Fuels</MenuItem>
                    {fuels.map((fuel) => (
                      <MenuItem key={fuel._id} value={fuel._id}>
                        {fuel.FuelType}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  New Pump
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
            {/* Pumps Table */}
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
                          active={sortBy === 'pumpName'}
                          direction={sortOrder}
                          onClick={() => handleSort('pumpName')}
                        >
                          Pump Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Station</TableCell>
                      <TableCell>Fuel Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'MaintenanceDate'}
                          direction={sortOrder}
                          onClick={() => handleSort('MaintenanceDate')}
                        >
                          Maintenance
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pumps.map((pump) => (
                      <TableRow key={pump._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: getPumpColor(pump.status, pump.MaintenanceDate),
                                mr: 1
                              }}
                            />
                            <Typography variant="body1" fontWeight="medium">
                              {pump.pumpName}
                            </Typography>
                            {pump.pumpDesc && (
                              <Tooltip title={pump.pumpDesc}>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  (i)
                                </Typography>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="body2">
                                {pump.stationID?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {pump.stationID?.location}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: getFuelColor(pump.fuelID?.FuelType),
                                mr: 1
                              }}
                            />
                            <Box>
                              <Typography variant="body2">
                                {pump.fuelID?.FuelType}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ${pump.fuelID?.UnitPrice?.toFixed(2)}/L
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pump.status === 1 ? 'Active' : 'Inactive'}
                            color={pump.status === 1 ? 'success' : 'default'}
                            size="small"
                            icon={pump.status === 1 ? <ActiveIcon /> : <InactiveIcon />}
                          />
                        </TableCell>
                        <TableCell>
                          {pump.MaintenanceDate ? (
                            <Box>
                              <Typography variant="body2">
                                {formatDate(pump.MaintenanceDate)}
                              </Typography>
                              {isMaintenanceOverdue(pump.MaintenanceDate) && (
                                <Chip
                                  label="Overdue"
                                  size="small"
                                  color="error"
                                  icon={<WarningIcon />}
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                              {isMaintenanceDue(pump.MaintenanceDate) && !isMaintenanceOverdue(pump.MaintenanceDate) && (
                                <Chip
                                  label="Due Soon"
                                  size="small"
                                  color="warning"
                                  icon={<WarningIcon />}
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not Scheduled
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(pump.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenViewDialog(pump)}
                              color="info"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(pump)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={pump.status === 1 ? "Deactivate" : "Activate"}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(pump._id, pump.status)}
                              color={pump.status === 1 ? "default" : "success"}
                            >
                              {pump.status === 1 ? <InactiveIcon /> : <ActiveIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(pump._id)}
                              color="error"
                              disabled={pump.status === 1}
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
            {maintenanceDuePumps.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No maintenance due pumps. All pumps are up to date!
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pump Name</TableCell>
                    <TableCell>Station</TableCell>
                    <TableCell>Fuel Type</TableCell>
                    <TableCell>Maintenance Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenanceDuePumps.map((pump) => {
                    const today = new Date();
                    const dueDate = new Date(pump.MaintenanceDate);
                    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <TableRow key={pump._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: isMaintenanceOverdue(pump.MaintenanceDate) ? '#f44336' : '#ff9800',
                                mr: 1
                              }}
                            />
                            <Typography variant="body1" fontWeight="medium">
                              {pump.pumpName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {pump.stationID?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pump.stationID?.location}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pump.fuelID?.FuelType}
                            size="small"
                            sx={{ bgcolor: getFuelColor(pump.fuelID?.FuelType), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(pump.MaintenanceDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pump.status === 1 ? 'Active' : 'Inactive'}
                            color={pump.status === 1 ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={daysUntilDue <= 0 ? 'Overdue' : `${daysUntilDue} days`}
                            color={daysUntilDue <= 0 ? 'error' : 'warning'}
                            size="small"
                            icon={<WarningIcon />}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenDialog(pump)}
                            color="primary"
                          >
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Select Station
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <Select
                      value={stationFilter}
                      onChange={(e) => setStationFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        Choose a station
                      </MenuItem>
                      {stations.map((station) => (
                        <MenuItem key={station._id} value={station._id}>
                          {station.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedStation && (
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {selectedStation.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <LocationIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        {selectedStation.location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {stationPumps.length} pumps
                      </Typography>
                    </Paper>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={9}>
              {stationFilter ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pump Name</TableCell>
                        <TableCell>Fuel Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Maintenance</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stationPumps.map((pump) => (
                        <TableRow key={pump._id} hover>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {pump.pumpName}
                            </Typography>
                            {pump.pumpDesc && (
                              <Typography variant="caption" color="text.secondary">
                                {pump.pumpDesc}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: getFuelColor(pump.fuelID?.FuelType),
                                  mr: 1
                                }}
                              />
                              <Typography variant="body2">
                                {pump.fuelID?.FuelType}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={pump.status === 1 ? 'Active' : 'Inactive'}
                              color={pump.status === 1 ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(pump.MaintenanceDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenDialog(pump)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <LocationIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Select a station to view its pumps
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        {tabValue === 3 && statistics && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pumps by Status
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Active Pumps
                      </Typography>
                      <Typography variant="body2">
                        {statistics.statusStats?.find(s => s._id === 1)?.count || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(statistics.statusStats?.find(s => s._id === 1)?.count / statistics.totalPumps) * 100 || 0}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Inactive Pumps
                      </Typography>
                      <Typography variant="body2">
                        {statistics.statusStats?.find(s => s._id === 0)?.count || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(statistics.statusStats?.find(s => s._id === 0)?.count / statistics.totalPumps) * 100 || 0}
                      color="default"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pumps by Station
                  </Typography>
                  {statistics.stationStats?.map((station, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          {station.stationName}
                        </Typography>
                        <Typography variant="body2">
                          {station.count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(station.count / statistics.totalPumps) * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pumps by Fuel Type
                  </Typography>
                  <Grid container spacing={2}>
                    {statistics.fuelStats?.map((fuel, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: getFuelColor(fuel.fuelType),
                                mr: 1
                              }}
                            />
                            <Typography variant="subtitle1">
                              {fuel.fuelType}
                            </Typography>
                          </Box>
                          <Typography variant="h5" align="center">
                            {fuel.count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" align="center" display="block">
                            pumps
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Pump Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editMode ? 'Edit Pump' : 'Add New Pump'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pump Name *"
                    name="pumpName"
                    value={currentPump.pumpName}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: <PumpIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Station *</InputLabel>
                    <Select
                      name="stationID"
                      value={currentPump.stationID}
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
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Fuel Type *</InputLabel>
                    <Select
                      name="fuelID"
                      value={currentPump.fuelID}
                      onChange={handleInputChange}
                      label="Fuel Type *"
                      required
                    >
                      <MenuItem value="" disabled>Select Fuel Type</MenuItem>
                      {fuels.map((fuel) => (
                        <MenuItem key={fuel._id} value={fuel._id}>
                          {fuel.FuelType} - ${fuel.UnitPrice}/L ({fuel.AvailableLiters?.toLocaleString()}L available)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <DatePicker
                    label="Next Maintenance Date"
                    value={currentPump.MaintenanceDate}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                    InputProps={{
                      startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="pumpDesc"
                    value={currentPump.pumpDesc}
                    onChange={handleInputChange}
                    margin="normal"
                    multiline
                    rows={3}
                    placeholder="Enter pump description, location notes, or special instructions..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={currentPump.status}
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

        {/* View Pump Dialog */}
        <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
          {viewPump && (
            <>
              <DialogTitle>
                Pump Details - {viewPump.pumpName}
              </DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: getPumpColor(viewPump.status, viewPump.MaintenanceDate) + '20', mb: 2 }}>
                        <Typography variant="h6" align="center" gutterBottom>
                          {viewPump.pumpName}
                        </Typography>
                        <Typography variant="h4" align="center" fontWeight="bold">
                          {viewPump.fuelID?.FuelType}
                        </Typography>
                        <Typography variant="body1" align="center" color="text.secondary">
                          ${viewPump.fuelID?.UnitPrice}/L
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Station:
                        </Typography>
                        <Typography variant="body2">
                          {viewPump.stationID?.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Location:
                        </Typography>
                        <Typography variant="body2">
                          {viewPump.stationID?.location}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Status:
                        </Typography>
                        <Chip
                          label={viewPump.status === 1 ? 'Active' : 'Inactive'}
                          color={viewPump.status === 1 ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Created:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(viewPump.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Next Maintenance:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(viewPump.MaintenanceDate)}
                        </Typography>
                      </Box>
                      {isMaintenanceDue(viewPump.MaintenanceDate) && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          Maintenance due soon!
                        </Alert>
                      )}
                      {isMaintenanceOverdue(viewPump.MaintenanceDate) && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          Maintenance overdue!
                        </Alert>
                      )}
                      {viewPump.pumpDesc && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Description:
                          </Typography>
                          <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
                            <Typography variant="body2">
                              {viewPump.pumpDesc}
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
                    handleOpenDialog(viewPump);
                  }}
                  variant="contained"
                  color="primary"
                >
                  Edit Pump
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

// Add missing icon
const CheckCircleIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

export default Pump;