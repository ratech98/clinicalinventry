const { DosageForm } = require("../modal/medicine");
const { errormesaages } = require("../errormessages");

const addDosageForm = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const DosageFormModel = tenantDBConnection.model('DosageForm', DosageForm.schema);
    
    const name = req.body.form_name.toLowerCase();

    const existingDosageForm = await DosageFormModel.findOne({ form_name: { $regex: new RegExp('^' + name + '$', 'i') } });
    
    if (existingDosageForm) {
      return res.status(400).json({ uccess:false,error: errormesaages[1019], errorCode: 1019});
    }

    const dosageForm = new DosageFormModel(req.body);
    await dosageForm.save();
    res.status(200).json({ success: true, message: "Dosage form added successfully", dosageForm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getAllDosageForms = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const DosageFormModel = tenantDBConnection.model('DosageForm', DosageForm.schema);
    const dosageForms = await DosageFormModel.find();
    res.json({ success: true, message: "Dosage forms fetched successfully", dosageForms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDosageFormById = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const DosageFormModel = tenantDBConnection.model('DosageForm', DosageForm.schema);
    const dosageForm = await DosageFormModel.findById(req.params.id);
    if (!dosageForm) {
      return res.status(404).json({ success:false,error: errormesaages[1005], errorCode: 1005 });
    }
    res.json({ success: true, message: "Dosage form fetched successfully", dosageForm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDosageForm = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const DosageFormModel = tenantDBConnection.model('DosageForm', DosageForm.schema);
    const dosageForm = await DosageFormModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dosageForm) {
      return res.status(404).json({success:false, error: errormesaages[1005], errorCode: 1005 });
    }
    res.status(200).json({ success: true, message: "Dosage form updated successfully", dosageForm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteDosageForm = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const DosageFormModel = tenantDBConnection.model('DosageForm', DosageForm.schema);
    const dosageForm = await DosageFormModel.findByIdAndDelete(req.params.id);
    if (!dosageForm) {
      return res.status(404).json({ success:false,error: errormesaages[1005], errorCode: 1005 });
    }
    res.json({ success: true, message: "Dosage form deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
                     addDosageForm, 
                     getAllDosageForms, 
                     getDosageFormById, 
                     updateDosageForm,
                      deleteDosageForm 
                    };
