const { errormesaages } = require("../errormessages");
const {Medicine }= require("../modal/medicine");

require("dotenv").config(); 

const addMedicine = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const MedicineModel = tenantDBConnection.model('Medicine', Medicine.schema);

    const medicine = new MedicineModel(req.body);

    await medicine.save();

    res.status(201).json({ success: true, message: "Medicine added successfully", medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllMedicines = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const MedicineModel = tenantDBConnection.model('Medicine', Medicine.schema);
    const medicines = await MedicineModel.find().populate()
     

    res.json({ success: true, message: "Medicines fetched successfully", medicines });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMedicineById = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const MedicineModel = tenantDBConnection.model('Medicine', Medicine.schema);
    const medicine = await MedicineModel.findById(req.params.id)
     

    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found", errorcode: 1003 });
    }

    res.json({ success: true, message: "Medicine fetched successfully", medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const updateMedicine = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const MedicineModel = tenantDBConnection.model('Medicine');

    const medicine = await MedicineModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!medicine) {
      return res.status(400).json({ error: "Medicine not found", errorcode: 1003 });
    }
    res.status(200).json({ success: true, message: "Medicine updated successfully", medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const MedicineModel = tenantDBConnection.model('Medicine', Medicine.schema);

    const medicine = await MedicineModel.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(400).json({ error: errormesaages[1003], errorcode: 1003 });
    }
    res.json({ success: true, message: "Medicine deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = { addMedicine, getAllMedicines, getMedicineById, updateMedicine, deleteMedicine };
