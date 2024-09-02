const { terms_and_conditions, about_us, helpandsupport, privacypolicy } = require("../modal/termsandconditions");
const { errormesaages } = require("../errormessages");


require("dotenv").config();

const createterms_and_conditions = async (req, res) => {
    try {
      await terms_and_conditions.deleteMany({});
  
      const newTermsAndConditions = new terms_and_conditions({
        content: req.body.content,
      });
  
      await newTermsAndConditions.save();
  
      res.status(200).json({
        success: true,
        message: "Terms and conditions added successfully",
        terms_and_conditions: newTermsAndConditions,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  

const getAllterms_and_conditionss = async (req, res) => {
  try {
    const terms_and_conditionss = await terms_and_conditions.find();
    res.json({ success: true, message: "terms_and_conditions fetched successfully", terms_and_conditionss });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getterms_and_conditionsById = async (req, res) => {
  try {
    const terms_and_conditions = await terms_and_conditions.findById(req.params.id);
    if (!terms_and_conditions) {
      return res
        .status(400)
        .json({ error: errormesaages[1055], errorcode: 1055 });
    }
    res.json({ success: true, message: "terms_and_conditions fetched successfully", terms_and_conditions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update terms_and_conditions
const updateterms_and_conditions = async (req, res) => {
  try {
    const terms_and_condition = await terms_and_conditions.findById(req.params.id);
    if (!terms_and_condition) {
      return res
        .status(400)
        .json({ error: errormesaages[1055], errorcode: 1055 });
    }

   

  

    terms_and_condition.content = req.body.content
    

    const updatedterms_and_conditions = await terms_and_condition.save();

    res.json({
      success: true,
      message: "terms_and_conditions updated successfully",
      terms_and_conditions: updatedterms_and_conditions,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteterms_and_conditions = async (req, res) => {
  try {
    const terms_and_conditions = await terms_and_conditions.findByIdAndDelete(req.params.id);
    if (!terms_and_conditions) {
      return res
        .status(400)
        .json({ error: errormesaages[1055], errorcode: 1055 });
    }
    res.json({ message: "terms_and_conditions deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const createaboutus = async (req, res) => {
    try {
      await about_us.deleteMany({});
  
      const aboutUsEntry = new about_us({
        content: req.body.content,
      });
  
      await aboutUsEntry.save();
  
      res.status(200).json({
        success: true,
        message: "About Us added successfully",
        about_us: aboutUsEntry,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  
  const getAllabout_us = async (req, res) => {
    try {
      const about_uss = await about_us.find();
      res.json({ success: true, message: "terms_and_conditions fetched successfully", about_uss });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  const updateupdateus = async (req, res) => {
    try {
      const aboutus = await about_us.findById(req.params.id);
      if (!aboutus) {
        return res
          .status(400)
          .json({ error: errormesaages[1055], errorcode: 1055 });
      }
  
     
  
    
  
      aboutus.content = req.body.content 
      
  
      const about_us = await aboutus.save();
  
      res.json({
        success: true,
        message: "aboutus updated successfully",
        about_us: about_us,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  const createhelpandsupport = async (req, res) => {
    try {
      
  
      const help_and_support = new helpandsupport(req.body);
  
      await help_and_support.save();
      res
        .status(200)
        .json({ success: true, message: "help_and_support added successfully", help_and_support });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  const getAllhelpandsupport = async (req, res) => {
    try {
      const help_and_support = await helpandsupport.find().populate({ path: 'clinicId', select: 'clinic_name' });
      res.json({ success: true, message: "help_and_support fetched successfully", help_and_support });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  const createaprivacypolicy = async (req, res) => {
    try {
      await privacypolicy.deleteMany({});
  
      const privacy_policy = new privacypolicy({
        content: req.body.content,
      });
  
      await privacy_policy.save();
  
      res.status(200).json({
        success: true,
        message: "privacy_policy added successfully",
        about_us: privacy_policy,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  
  const getAllprivacy_policy = async (req, res) => {
    try {
      const privacy_policy = await privacypolicy.find();
      res.json({ success: true, message: "privacy_policy fetched successfully", privacy_policy });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  const updateprivacy_policy = async (req, res) => {
    try {
      const privacy_policy = await privacypolicy.findById(req.params.id);
      if (!privacy_policy) {
        return res
          .status(400)
          .json({ error: errormesaages[1055], errorcode: 1055 });
      }
  
     
  
    
  
      privacy_policy.content = req.body.content 
      
  
      const updatedprivacy_policy = await privacy_policy.save();
  
      res.json({
        success: true,
        message: "aboutus updated successfully",
        privacy_policys: updatedprivacy_policy,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

module.exports = {
  createterms_and_conditions,
  getAllterms_and_conditionss,
  getterms_and_conditionsById,
  updateterms_and_conditions,
  deleteterms_and_conditions,
  updateupdateus,
  createaboutus,
  getAllabout_us,
  createhelpandsupport,
  getAllhelpandsupport,
  createaprivacypolicy,
  getAllprivacy_policy,
  updateprivacy_policy


};
