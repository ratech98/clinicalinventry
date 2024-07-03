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

    const filters = {};

    if (req.query.dosage_form) {
      filters.dosage_form = req.query.dosage_form;
    }

    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.medicine_name) {
      filters.medicine_name = { $regex: req.query.medicine_name, $options: 'i' };
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const totalMedicines = await MedicineModel.countDocuments(filters);
    const totalPages = Math.ceil(totalMedicines / limit);

    const medicines = await MedicineModel.find(filters)
      .skip(startIndex)
      .limit(limit);

    res.json({
      success: true,
      message: "Medicines fetched successfully",
      medicines,
      totalCount: totalMedicines,
      page,
      limit,
      totalPages,
      startIndex: startIndex + 1,
      endIndex: endIndex > totalMedicines ? totalMedicines : endIndex,
      currentPage: page
    });
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
      return res.status(404).json({success:false, error: "Medicine not found", errorcode: 1003 });
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
    
    const MedicineModel = tenantDBConnection.model('Medicine',Medicine.schema);

    const medicine = await MedicineModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!medicine) {
      return res.status(400).json({ success:false,error: "Medicine not found", errorcode: 1003 });
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
      return res.status(400).json({success:false, error: errormesaages[1003], errorcode: 1003 });
    }
    res.json({ success: true, message: "Medicine deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const importMedicinesData = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const MedicineModel = tenantDBConnection.model('Medicine', Medicine.schema);

    if (!req.files || !req.files.file) {
      return res.status(400).json({success:false, error: "No file uploaded" });
    }

    const file = req.files.file[0];
    const buffer = file.buffer;

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    const medicines = jsonData.map(item => ({
      medicine_name: item.medicine_name,
      dosage_form: item.dosage_form ? item.dosage_form.split(',') : [],
      dosage_strength: item.dosage_strength,
      dosage_unit: item.dosage_unit,
      status: item.status || "Available",
    }));

    const missingFields = [];

    await Promise.all(
      medicines.map(async (medicine) => {
        try {
          if (!medicine.medicine_name) {
            missingFields.push('Unnamed Medicine');
            return;
          }
          await MedicineModel.create(medicine);
        } catch (error) {
          console.error(error);
          missingFields.push(medicine.medicine_name || 'Unnamed Medicine');
        }
      })
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Some medicines were not imported due to missing required fields or other issues: ${missingFields.join(", ")}`
      });
    }

    res.status(200).json({ success: true, message: "Medicines imported successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = { addMedicine,
                    getAllMedicines, 
                    getMedicineById, 
                    updateMedicine, 
                    deleteMedicine ,
                    importMedicinesData
                   
                  };
