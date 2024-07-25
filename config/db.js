require("dotenv").config(); 
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const Clinic = require("../modal/clinic.");

const tenantConnections = {};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
    });
    console.log("mongodb connection success!");

    // Fetch all tenants and connect to their databases if they have a dbUri
    const clinics = await Clinic.find({});
    for (const clinic of clinics) {
      if (clinic.dbUri) {
        tenantConnections[clinic._id] = await mongoose.createConnection(clinic.dbUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000, 
        });
        console.log(`Connected to tenant DB: ${clinic.dbUri}`);
      } else {
        console.log(`Skipping clinic with ID ${clinic._id} as it does not have a dbUri`);
      }
    }
  } catch (err) {
    console.log("mongodb connection failed!", err.message);
  }
};

const connectTenantDB = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]; // Assuming the token is in the format "Bearer <token>"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    console.log(decoded)
    const userId = decoded._id;

    const tenant = await Clinic.findById(userId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    if (!tenant.dbUri) {
      return res.status(400).json({success:false, message: "Tenant does not have a database URI" });
    }

    let tenantDBConnection = tenantConnections[tenant._id];
    if (!tenantDBConnection) {
      tenantDBConnection = await mongoose.createConnection(tenant.dbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, 
      });
      tenantConnections[tenant._id] = tenantDBConnection;
      console.log(`Connected to tenant DB: ${tenant.dbUri}`);
    }

    req.tenantDBConnection = tenantDBConnection;
    next();
  } catch (err) {
    console.error("Error connecting to tenant database:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  connectDB,
  connectTenantDB,
  tenantConnections
};
