const {SMSType, SMSTemplate} = require('../modal/smstemplate'); // Adjust the path as necessary
const { errormesaages } = require("../errormessages");

// Add a new SMS Type
const addSMSType = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const SMSTypeModel = tenantDBConnection.model('SMSType', SMSType.schema);

    const name = req.body.name.toLowerCase();

    // Check if SMS Type already exists
    const existingSMSType = await SMSTypeModel.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });

    if (existingSMSType) {
      return res.status(400).json({ success: false, error: errormesaages[1034], errorCode: 1034 });
    }

    const newSMSType = new SMSTypeModel(req.body);
    await newSMSType.save();
    res.status(200).json({ success: true, message: "SMS Type added successfully", SMSType: newSMSType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllSMSTypes = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const SMSTypeModel = tenantDBConnection.model('SMSType', SMSType.schema);

    const totalCount = await SMSTypeModel.countDocuments();
    const totalPages = Math.ceil(totalCount / limitNum);

    const skip = (pageNum - 1) * limitNum;
    const SMSTypes = await SMSTypeModel.find().skip(skip).limit(limitNum);

    res.json({
      success: true,
      message: "SMS Types fetched successfully",
      SMSTypes,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      startIndex: skip + 1,
      endIndex: skip + SMSTypes.length,
      currentPage: pageNum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSMSTypeById = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const SMSTypeModel = tenantDBConnection.model('SMSType', SMSType.schema);

    const SMSTypes = await SMSTypeModel.findById(req.params.id);
    if (!SMSTypes) {
      return res.status(404).json({ success: false, error: errormesaages[1035], errorCode: 1035 });
    }
    res.json({ success: true, message: "SMS Type fetched successfully", SMSTypes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSMSType = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const SMSTypeModel = tenantDBConnection.model('SMSType', SMSType.schema);

    const SMSTypes = await SMSTypeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!SMSTypes) {
      return res.status(404).json({ success: false, error: errormesaages[1035], errorCode: 1035 });
    }
    res.status(200).json({ success: true, message: "SMS Type updated successfully", SMSTypes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteSMSType = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const SMSTypeModel = tenantDBConnection.model('SMSType', SMSType.schema);

    const SMSTypes = await SMSTypeModel.findByIdAndDelete(req.params.id);
    if (!SMSTypes) {
      return res.status(404).json({ success: false, error: errormesaages[1035], errorCode: 1035 });
    }
    res.json({ success: true, message: "SMS Type deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addSMSTemplate = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const SMSTemplateModel = tenantDBConnection.model('SMSTemplate', SMSTemplate.schema);

    const { smstypeId,  body } = req.body;

    const existingTemplate = await SMSTemplateModel.findOne({  smstypeId });

    if (existingTemplate) {
      return res.status(400).json({ success: false, error: errormesaages[1036], errorCode: 1036 });
    }

    const smstemplate = new SMSTemplateModel({  smstypeId, body });
    await smstemplate.save();
    res.status(200).json({ success: true, message: "SMSTemplate added successfully", smstemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllSMSTemplates = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const SMSTemplateModel = tenantDBConnection.model('SMSTemplate', SMSTemplate.schema);

    const totalCount = await SMSTemplateModel.countDocuments();
    const totalPages = Math.ceil(totalCount / limitNum);

    const skip = (pageNum - 1) * limitNum;
    const smstemplates = await SMSTemplateModel.find().skip(skip).limit(limitNum);

    res.json({
      success: true,
      message: "SMSTemplates fetched successfully",
      smstemplates,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      startIndex: skip + 1,
      endIndex: skip + smstemplates.length,
      currentPage: pageNum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSMSTemplateById = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const SMSTemplateModel = tenantDBConnection.model('SMSTemplate', SMSTemplate.schema);
    const smstemplate = await SMSTemplateModel.findById(req.params.id);
    if (!smstemplate) {
      return res.status(404).json({ success: false, error: errormesaages[1037], errorCode: 1037 });
    }
    res.json({ success: true, message: "SMSTemplate fetched successfully", smstemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSMSTemplate = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const SMSTemplateModel = tenantDBConnection.model('SMSTemplate', SMSTemplate.schema);
    const smstemplate = await SMSTemplateModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!smstemplate) {
      return res.status(404).json({ success: false, error: errormesaages[1037], errorCode: 1037 });
    }
    res.status(200).json({ success: true, message: "SMSTemplate updated successfully", smstemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete an SMSTemplate
const deleteSMSTemplate = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const SMSTemplateModel = tenantDBConnection.model('SMSTemplate', SMSTemplate.schema);
    const smstemplate = await SMSTemplateModel.findByIdAndDelete(req.params.id);
    if (!smstemplate) {
      return res.status(404).json({ success: false, error: errormesaages[1037], errorCode: 1037 });
    }
    res.json({ success: true, message: "SMSTemplate deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



module.exports = {
  addSMSType,
  getAllSMSTypes,
  getSMSTypeById,
  updateSMSType,
  deleteSMSType,
  addSMSTemplate,
  getAllSMSTemplates,
  getSMSTemplateById,
  updateSMSTemplate,
  deleteSMSTemplate
};
