// dosageUnitController.js
const { DosageUnit } = require('../modal/medicine');
const { errormesaages } = require("../errormessages");

const addDosageUnit = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const DosageUnitModel = tenantDBConnection.model('DosageUnit', DosageUnit.schema);

    const name = req.body.unit_name.toLowerCase();

    const existingDosageUnit = await DosageUnitModel.findOne({ unit_name: { $regex: new RegExp('^' + name + '$', 'i') } });

    if (existingDosageUnit) {
      return res.status(400).json({ success:false,error: errormesaages[1020], errorCode: 1020  });
    }

    const dosageUnit = new DosageUnitModel(req.body);
    await dosageUnit.save();
    res.status(200).json({ success: true, message: "Dosage unit added successfully", dosageUnit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getAllDosageUnits = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const DosageUnitModel = tenantDBConnection.model('DosageUnit', DosageUnit.schema);
    const dosageUnits = await DosageUnitModel.find();
    res.json({ success: true, message: "Dosage units fetched successfully", dosageUnits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDosageUnitById = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const DosageUnitModel = tenantDBConnection.model('DosageUnit', DosageUnit.schema);
    const dosageUnit = await DosageUnitModel.findById(req.params.id);
    if (!dosageUnit) {
      return res.status(404).json({ success:false,error: errormesaages[1006], errorCode: 1006 });
    }
    res.json({ success: true, message: "Dosage unit fetched successfully", dosageUnit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDosageUnit = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const DosageUnitModel = tenantDBConnection.model('DosageUnit', DosageUnit.schema);
    const dosageUnit = await DosageUnitModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dosageUnit) {
      return res.status(404).json({success:false, error: errormesaages[1006], errorCode: 1006 });
    }
    res.status(200).json({ success: true, message: "Dosage unit updated successfully", dosageUnit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteDosageUnit = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const DosageUnitModel = tenantDBConnection.model('DosageUnit', DosageUnit.schema);
    const dosageUnit = await DosageUnitModel.findByIdAndDelete(req.params.id);
    if (!dosageUnit) {
      return res.status(404).json({ success:false,error: errormesaages[1006], errorCode: 1006 });
    }
    res.json({ success: true, message: "Dosage unit deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
                    addDosageUnit, 
                    getAllDosageUnits, 
                    getDosageUnitById, 
                    updateDosageUnit, 
                    deleteDosageUnit 
                };
