
const errorMessages = require("../errormessages");
const bondtype = require("../modal/bondtype");

const createbondtype = async (req, res) => {
  try {
    const newbondtypeName = req.body.name.toLowerCase();

    const existingbondtype = await bondtype.findOne({
      name: { $regex: new RegExp("^" + newbondtypeName, "i") },
    });
    if (existingbondtype) {
      return res
        .status(400)
        .json({ error: errorMessages[1014], errorcode: 1015 });
    }
    const bondtypes = new bondtype(req.body);
    await bondtypes.save();
    res
      .status(200)
      .json({ success: true, message: "bondtype created successfully", bondtype });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllbondtypes = async (req, res) => {
  try {

    const bondtypes = await bondtype.find();
    res.json({ success: true, message: "bondtypes fetched successfully", bondtypes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





const getbondtypes = async (req, res) => {
  try {
    const { countryId } = req.query;

    const query = { published: true };
    if (countryId) {
      query.country = countryId;
    }

    const bondtypes = await bondtype.find(query).populate("country");
    res.json({ success: true, message: "bondtypes fetched successfully", bondtypes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getbondtypeById = async (req, res) => {
  try {
    const bondtype = await bondtype.findById(req.params.id);
    if (!bondtype) {
      return res
        .status(400)
        .json({ error: errorMessages[1014], errorcode: 1015 });
    }
    res.json({ success: true, message: "bondtype created successfully", bondtype });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update bondtype
const updatebondtype = async (req, res) => {
  try {
    const bondtype = await bondtype.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!bondtype) {
      return res
        .status(400)
        .json({ error: errorMessages[1015], errorcode: 1015 });
    }
    res.json({ success: true, message: "bondtype updated successfully", bondtype });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete bondtype
const deletebondtype = async (req, res) => {
  try {
    const bondtype = await bondtype.findByIdAndDelete(req.params.id);
    if (!bondtype) {
      return res
        .status(400)
        .json({ error: errorMessages[1015], errorcode: 1015 });
    }
    res.json({ success: true, message: "bondtype deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


module.exports = {
  createbondtype,
  getAllbondtypes,
  getbondtypeById,
  updatebondtype,
  deletebondtype,

};
