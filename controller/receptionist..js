const { errormesaages } = require("../errormessages");
const { ReceptionistAvailability } = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const Receptionist = require("../modal/receptionist");

const addReceptionist = async (req, res) => {
  try {
    const receptionist = await Receptionist.create(req.body);
    res.status(201).json({ success: true, message: "Receptionist added successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllReceptionists = async (req, res) => {
  try {
    const receptionists = await Receptionist.find().populate('clinic');
    res.json({ success: true, message: "Receptionists fetched successfully", receptionists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getReceptionists = async (req, res) => {
  try {
    const receptionists = await Receptionist.find({ clinic: req.body.clinic }).populate('clinic');
    res.json({ success: true, message: "Receptionists fetched successfully", receptionists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getClinicDetailsByreceptionistId = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.body.id).populate('clinic');
    if (!receptionist) {
      return res.status(404).json({ error: 'Receptionist not found' });
    }

    const clinic = receptionist.clinic;
    res.status(200).json({ success: true, message: 'Clinic details fetched successfully', clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getReceptionistById = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.params.id).populate('clinic');
    if (!receptionist) {
      return res.status(404).json({ error: errormesaages[1004], errorcode: 1004 });
    }
    res.json({ success: true, message: "Receptionist fetched successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateReceptionist = async (req, res) => {
  try {
    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!receptionist) {
      return res.status(400).json({ error: errormesaages[1004], errorcode: 1004 });
    }
    res.status(200).json({ success: true, message: "Receptionist updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteReceptionist = async (req, res) => {
  try {
    const receptionist = await Receptionist.findByIdAndDelete(req.params.id);
    if (!receptionist) {
      return res.status(400).json({ error: errormesaages[1004], errorcode: 1004 });
    }
    res.json({ success: true, message: "Receptionist deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateReceptionistStatus = async (req, res) => {
  try {
    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id, { availability: req.body.availability }, { new: true });
    if (!receptionist) {
      return res.status(400).json({ error: errormesaages[1004], errorcode: 1004 });
    }
    res.status(200).json({ success: true, message: "Receptionist status updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateReceptionistVerify = async (req, res) => {
  try {
    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id, { verify: req.body.verify }, { new: true });
    if (!receptionist) {
      return res.status(400).json({ error: errormesaages[1004], errorcode: 1004 });
    }
    res.status(200).json({ success: true, message: "Receptionist status updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





const sendReceptionistOtp = async (req, res) => {
  const { mobile_number, clinicId } = req.body;
  const otp = "1234";

  try {
    const receptionist = await Receptionist.findOneAndUpdate(
      { mobile_number },
      { mobile_number, otp, clinic: clinicId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await receptionist.save();

    // Code to send OTP via SMS
    // sendOtpSms(mobile_number, otp); // Uncomment and implement this function

    res.status(200).json({ success: true, message: 'OTP sent successfully and clinic set', receptionist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyReceptionistOtp = async (req, res) => {
  const { mobile_number, otp } = req.body;

  try {
    const receptionist = await Receptionist.findOne({ mobile_number });

    if (!receptionist) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (otp !== receptionist.otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    receptionist.otpVerified = true;
    await receptionist.save();

    res.status(200).json({ success: true, message: 'OTP verified successfully', receptionist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReceptionistsByClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const receptionists = await Receptionist.find({ clinic: id }).populate('clinic');
    res.status(200).json({ success: true, message: "fetch receptionist successfully", receptionists });
  } catch (error) {
    console.error('Error fetching receptionists:', error);
    res.status(500).json({ message: 'Error fetching receptionists', error });
  }
};

module.exports = {
  addReceptionist,
  getAllReceptionists,
  getReceptionistById,
  updateReceptionist,
  deleteReceptionist,
  updateReceptionistStatus,
  updateReceptionistVerify,
  
  getReceptionists,
  getClinicDetailsByreceptionistId,
  sendReceptionistOtp,
  verifyReceptionistOtp,
  getReceptionistsByClinic
};
