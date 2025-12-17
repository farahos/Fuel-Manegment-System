
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './hooks/useUser';
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login.jsx';




import Register from './pages/Register.jsx';
import Home from './components/Home.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import Customers from './admin/Customers.jsx';
import Employees from './admin/Employees.jsx';
import Fuels from './admin/Fuels.jsx';
import FuelOrderHistory from './admin/Fuel_order_history.jsx'
import Pumps from './admin/Pumps.jsx';
import Sales from './admin/Sales.jsx';
import Stations from './admin/Stations.jsx';
import Suppliers from './admin/Suppliers.jsx';





const router = createBrowserRouter([
  {
    path: "/", element: <App/>,
    children:[
         { path: '/', 
          element: <Home /> },
        { path: '/login', 
          element: <Login/> },
            { path: '/Register', 
          element: <Register/> },
         
           { path: '/admin-dashboard', 
          element: <AdminDashboard /> },
          {path: '/customers',
          element: <Customers />},
          {path: '/employees',
          element: <Employees />},
          {path: '/fuels',
          element: <Fuels />},
          {path: '/fuel_order_history',
          element: <FuelOrderHistory />},
          {path: '/pumps',
          element: <Pumps />},
          {path: '/sales',
          element: <Sales />},
          {path: '/stations',
          element: <Stations />}, 
          {path: '/suppliers',
          element: <Suppliers />},
          
         
       

        

         
    ]
  
  }
])
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>

    <Toaster />
    <RouterProvider router={router} />
    </UserProvider>

  </React.StrictMode>
);
