import express from 'express';
import conectBD from './config/db.js';
import userRouter from './routes/UserRoute.js';

import cookieParser from 'cookie-parser';
import TokenRoute from './routes/TokenRoute.js';
import customerRoutes from './routes/CustomerRoutes.js'
import employeeRoutes from './routes/EmployeeRoutes.js'
import stationRoutes from './routes/StationRoutes.js'
// import saleRoutes from "./routes/SaleRoutes.js";
import pumpRoutes from './routes/PumpRoutes.js';
import fuelRoutes from './routes/FuelRoutes.js'
const app = express();
const PORT = 8000

app.use(express.json());
app.use(cookieParser());

app.use('/api/user', userRouter);
app.use("/api/customers", customerRoutes);
app.use("/api/employees", employeeRoutes);
// app.use("/api/sales", saleRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/pumps", pumpRoutes);
app.use("/api/fuels", fuelRoutes);




// forget password
app.use('/api/forgetpassword', TokenRoute);


conectBD();
app.listen(PORT ,()=>{
    console.log(`Server is running on port ${PORT}`);

})
