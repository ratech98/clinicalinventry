const errorMessages = require("../errormessages");
const { StaffRole } = require("../modal/admin");

require("dotenv").config();

const createStaffRoles = async (req, res) => {
  try {
    const newStaffRolesName = req.body.role.toLowerCase();

    const existingStaffRoles = await StaffRole.findOne({
      role: { $regex: new RegExp("^" + newStaffRolesName, "i") },
    });
    if (existingStaffRoles) {
      return res
        .status(400)
        .json({ error: errorMessages[1104], errorcode: 1104 });
    }
    const StaffRolesName = req.body.role;
   

    const StaffRoless = new StaffRole({
      role: StaffRolesName,
      published:false
    });

    await StaffRoless.save();
    res
      .status(200)
      .json({ success: true, message: "StaffRoles added successfully", StaffRoless });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all categories
const getAllStaffRoless = async (req, res) => {
  try {
    const StaffRoless = await StaffRole.find();
    res.json({ success: true, message: "StaffRoles fetched successfully", StaffRoless });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getStaffRoles = async (req, res) => {
    try {
      const StaffRoless = await StaffRole.find({published:true});
      res.json({ success: true, message: "StaffRoles fetched successfully", StaffRoless });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
// Get StaffRoles by ID
const getStaffRolesById = async (req, res) => {
  try {
    const StaffRoles = await StaffRole.findById(req.params.id);
    if (!StaffRoles) {
      return res
        .status(400)
        .json({ error: errorMessages[1103], errorcode: 1103 });
    }
    res.json({ success: true, message: "StaffRoles fetched successfully", StaffRoles });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update StaffRoles
const updateStaffRoles = async (req, res) => {
  try {
    const StaffRoles = await StaffRole.findById(req.params.id);
    if (!StaffRoles) {
      return res
        .status(400)
        .json({ error: errorMessages[1103], errorcode: 1103 });
    }

   

  

    StaffRoles.role = req.body.role || StaffRoles.role;
    

    const updatedStaffRoles = await StaffRoles.save();

    res.json({
      success: true,
      message: "StaffRoles updated successfully",
      StaffRoles: updatedStaffRoles,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete StaffRoles
const deleteStaffRoles = async (req, res) => {
  try {
    const StaffRoles = await StaffRole.findByIdAndDelete(req.params.id);
    if (!StaffRoles) {
      return res
        .status(400)
        .json({ error: errorMessages[1103], errorcode: 1103 });
    }
    res.json({ message: "StaffRoles deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updatepublishedstatus=async (req, res) => {
    try {
        const { published } = req.body;
        const updatedStaffRole = await StaffRole.findByIdAndUpdate(req.params.id, { published }, { new: true });
        res.json(updatedStaffRole);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
  createStaffRoles,
  getAllStaffRoless,
  getStaffRolesById,
  updateStaffRoles,
  deleteStaffRoles,
  updatepublishedstatus,
  getStaffRoles

};
