const express = require("express");
const bodyParser = require("body-parser");
const { connectDB } = require("../config/db");
const cors = require("cors");

const clinicRouter = require('../routes/clinicRotes');
const doctorRouter = require("../routes/doctorRoutes");
const medicineRouter = require('../routes/medicineRoutes');
const otpRouter = require('../routes/otpRoutes');
const patientRouter = require('../routes/patientRoutes');
const receptionistRouter = require('../routes/receptionistRoutes');
const staffRoleRouter=require('../routes/staffRoleRoutes')
const adminRouter=require('../routes/adminRoutes')
const prescriptiontemplateRouter=require('../routes/prescriptionTemplaateRoutes')
const notificationrouter=require('../routes/notificationRouter')
const subscriptionRouter= require('../routes/subscriptionRouter')
const smstemplateRouter=require('../routes/smstemplateRouter')

const app = express();
const PORT = process.env.PORT || 5050;

connectDB();

app.use(cors()); // Apply CORS middleware first
app.use(express.json()); // Parse JSON bodies

app.use((req, res, next) => {
 
  next();
});

app.use('/', clinicRouter);
app.use('/', doctorRouter);
app.use('/', medicineRouter);
app.use('/',smstemplateRouter)
app.use('/',subscriptionRouter)
app.use('/',notificationrouter)
app.use('/', otpRouter);
app.use('/', patientRouter);
app.use('/', receptionistRouter);
app.use('/',prescriptiontemplateRouter)
app.use('/',adminRouter)
app.use('/',staffRoleRouter)

app.get("/", (req, res) => {
  res.send("Server up!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
