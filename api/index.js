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
app.use('/', otpRouter);
app.use('/', patientRouter);
app.use('/', receptionistRouter);

app.get("/", (req, res) => {
  res.send("Server up!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
