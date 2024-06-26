require("dotenv").config(); 
const jwt = require('jsonwebtoken');

const mongoose = require("mongoose");
const Clinic = require("../modal/clinic.");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("mongodb connection success!");
  } catch (err) {
    console.log("mongodb connection failed!", err.message);
  }
};

const connectTenantDB = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]; // Assuming the token is in the format "Bearer <token>"
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    const userId = decoded._id;

    const tenant = await Clinic.findById(userId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    
    const tenantDBURI = tenant.dbUri;
    const tenantDBConnection = await mongoose.createConnection(tenantDBURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Registering schemas on tenantDBConnection if not already registered
    if (!tenantDBConnection.models.DosageForm) {
      tenantDBConnection.model('DosageForm', new mongoose.Schema({
        name: { type: String, required: true }
      }));
    }

    if (!tenantDBConnection.models.DosageUnit) {
      tenantDBConnection.model('DosageUnit', new mongoose.Schema({
        name: { type: String, required: true }
      }));
    }

    if (!tenantDBConnection.models.Medicine) {
      tenantDBConnection.model('Medicine', new mongoose.Schema({
        medicine_name: { type: String, required: true, unique: true },
        dosage_form: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DosageForm' }],
        dosage_strength: { type: String },
        dosage_unit: { type: mongoose.Schema.Types.ObjectId, ref: 'DosageUnit' },
        status: { type: String, enum: ["Available", "OutofStock"] }
      }, { timestamps: true }));
    }

    console.log('Connected to tenant DB:', tenantDBURI);
    req.tenantDBConnection = tenantDBConnection;
    next();
  } catch (err) {
    console.error("Error connecting to tenant database:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};





module.exports = {
  connectDB,
  connectTenantDB
};
