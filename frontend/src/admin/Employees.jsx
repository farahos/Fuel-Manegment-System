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
  Avatar,
  Tooltip,
  Card,
  CardContent,
  Stack,
  FormGroup,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Visibility
} from '@mui/icons-material';

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [stations, setStations] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState({
    Name: '',
    Email: '',
    UserName: '',
    Password: '',
    ConfirmPassword: '',
    Role: 'employee',
    Sex: 'male',
    ContactNumber: '',
    StationID: '',
    status: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch employees
  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { role: roleFilter }),
        ...(stationFilter && { station: stationFilter })
      };

      const response = await axios.get('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setEmployees(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      showAlert('Error fetching employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stations for dropdown
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

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/employees/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchStations();
    fetchStats();
  }, [searchTerm, statusFilter, roleFilter, stationFilter]);

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setCurrentEmployee({
        ...employee,
        Password: '',
        ConfirmPassword: ''
      });
      setEditMode(true);
    } else {
      setCurrentEmployee({
        Name: '',
        Email: '',
        UserName: '',
        Password: '',
        ConfirmPassword: '',
        Role: 'employee',
        Sex: 'male',
        ContactNumber: '',
        StationID: '',
        status: 1
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEmployee({
      Name: '',
      Email: '',
      UserName: '',
      Password: '',
      ConfirmPassword: '',
      Role: 'employee',
      Sex: 'male',
      ContactNumber: '',
      StationID: '',
      status: 1
    });
    setShowPassword(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEmployee(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!currentEmployee.Name.trim()) {
      showAlert('Name is required', 'error');
      return false;
    }
    if (!currentEmployee.Email.trim()) {
      showAlert('Email is required', 'error');
      return false;
    }
    if (!editMode && !currentEmployee.Password) {
      showAlert('Password is required', 'error');
      return false;
    }
    if (currentEmployee.Password && currentEmployee.Password.length < 6) {
      showAlert('Password must be at least 6 characters', 'error');
      return false;
    }
    if (currentEmployee.Password !== currentEmployee.ConfirmPassword) {
      showAlert('Passwords do not match', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      const employeeData = { ...currentEmployee };
      
      // Remove confirm password field
      delete employeeData.ConfirmPassword;
      
      // If password is empty in edit mode, remove it
      if (editMode && !employeeData.Password) {
        delete employeeData.Password;
      }

      let response;
      if (editMode) {
        response = await axios.put(
          `/api/employees/${currentEmployee._id}`,
          employeeData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          '/api/employees',
          employeeData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        showAlert(
          editMode ? 'Employee updated successfully!' : 'Employee created successfully!',
          'success'
        );
        fetchEmployees();
        fetchStats();
        handleCloseDialog();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving employee', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `/api/employees/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          showAlert('Employee deleted successfully!', 'success');
          fetchEmployees();
          fetchStats();
        }
      } catch (error) {
        showAlert(error.response?.data?.message || 'Error deleting employee', 'error');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/employees/${id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        fetchEmployees();
        fetchStats();
      }
    } catch (error) {
      showAlert('Error updating status', 'error');
    }
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
    fetchEmployees(value);
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'station_manager': return 'warning';
      case 'cashier': return 'info';
      case 'pump_operator': return 'secondary';
      default: return 'default';
    }
  };

  const getSexIcon = (sex) => {
    return sex === 'male' ? '♂' : '♀';
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 3 }}>
        Employee Management
      </Typography>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <BadgeIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Employees
                    </Typography>
                    <Typography variant="h5">
                      {stats.totalEmployees}
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
                      Active Employees
                    </Typography>
                    <Typography variant="h5">
                      {stats.activeEmployees}
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
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Administrators
                    </Typography>
                    <Typography variant="h5">
                      {stats.adminCount}
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
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Station Managers
                    </Typography>
                    <Typography variant="h5">
                      {stats.stationManagers}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search employees..."
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
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="station_manager">Station Manager</MenuItem>
                <MenuItem value="cashier">Cashier</MenuItem>
                <MenuItem value="pump_operator">Pump Operator</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
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
          <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add New Employee
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Employees Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Station</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: employee.status === 1 ? 'primary.main' : 'grey.400' }}>
                        {employee.Name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {employee.Name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{employee.UserName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        <EmailIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        {employee.Email}
                      </Typography>
                      {employee.ContactNumber && (
                        <Typography variant="body2">
                          <PhoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          {employee.ContactNumber}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employee.Role}
                      color={getRoleColor(employee.Role)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {getSexIcon(employee.Sex)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {employee.StationID ? (
                      <Chip
                        label={employee.StationID.name}
                        size="small"
                        icon={<BusinessIcon />}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not Assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employee.status === 1 ? 'Active' : 'Inactive'}
                      color={employee.status === 1 ? 'success' : 'default'}
                      size="small"
                      icon={employee.status === 1 ? <ActiveIcon /> : <InactiveIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(employee)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={employee.status === 1 ? "Deactivate" : "Activate"}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(employee._id, employee.status)}
                        color={employee.status === 1 ? "default" : "success"}
                      >
                        {employee.status === 1 ? <InactiveIcon /> : <ActiveIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(employee._id)}
                        color="error"
                        disabled={employee.Role === 'admin'}
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

      {/* Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  name="Name"
                  value={currentEmployee.Name}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email *"
                  name="Email"
                  type="email"
                  value={currentEmployee.Email}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Username *"
                  name="UserName"
                  value={currentEmployee.UserName}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role *</InputLabel>
                  <Select
                    name="Role"
                    value={currentEmployee.Role}
                    onChange={handleInputChange}
                    label="Role *"
                  >
                    <MenuItem value="admin">Administrator</MenuItem>
                    <MenuItem value="station_manager">Station Manager</MenuItem>
                    <MenuItem value="cashier">Cashier</MenuItem>
                    <MenuItem value="pump_operator">Pump Operator</MenuItem>
                    <MenuItem value="employee">General Employee</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="Sex"
                    value={currentEmployee.Sex}
                    onChange={handleInputChange}
                    label="Gender"
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="ContactNumber"
                  value={currentEmployee.ContactNumber}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Assign Station</InputLabel>
                  <Select
                    name="StationID"
                    value={currentEmployee.StationID}
                    onChange={handleInputChange}
                    label="Assign Station"
                  >
                    <MenuItem value="">Not Assigned</MenuItem>
                    {stations.map((station) => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.name} - {station.location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {!editMode && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Password *"
                      name="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={currentEmployee.Password}
                      onChange={handleInputChange}
                      margin="normal"
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Confirm Password *"
                      name="ConfirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={currentEmployee.ConfirmPassword}
                      onChange={handleInputChange}
                      margin="normal"
                      required
                    />
                  </Grid>
                </>
              )}
              {editMode && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Leave password fields empty to keep current password
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={currentEmployee.Password}
                        onChange={handleInputChange}
                        margin="normal"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOffIcon /> : <ViewIcon />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="ConfirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={currentEmployee.ConfirmPassword}
                        onChange={handleInputChange}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              )}
              <Grid item xs={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={currentEmployee.status === 1}
                        onChange={(e) =>
                          setCurrentEmployee(prev => ({
                            ...prev,
                            status: e.target.checked ? 1 : 0
                          }))
                        }
                      />
                    }
                    label="Active Account"
                  />
                </FormGroup>
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

export default Employee;