const { errormesaages } = require("../errormessages");
const { ReceptionistAvailability } = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const Receptionist = require("../modal/receptionist");
const { Storage } = require("@google-cloud/storage");

require("dotenv").config();
const bucketName = process.env.bucketName;
const gcsStorage = new Storage();

const addReceptionist = async (req, res) => {
  try {
    const receptionist = await Receptionist.create(req.body);
    res.status(200).json({ success: true, message: "Receptionist added successfully", receptionist });
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
      return res.status(404).json({success:false, error: 'Receptionist not found' });
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
      return res.status(404).json({success:false,error: errormesaages[1004], errorcode: 1004 });
    }
    res.json({ success: true, message: "Receptionist fetched successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateReceptionist = async (req, res) => {

  try {
    const originalFilename = req.file.originalname;
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.]/g, '_');
    const imagePath = `receptionst/${Date.now()}_${sanitizedFilename}`;
    await gcsStorage.bucket(bucketName).file(imagePath).save(req.file.buffer);
   req.body.profile=`https://storage.googleapis.com/${bucketName}/${imagePath}`
    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!receptionist) {
      return res.status(400).json({success:false, error: errormesaages[1004], errorcode: 1004 });
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
      return res.status(400).json({success:false, error: errormesaages[1004], errorcode: 1004 });
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
      return res.status(400).json({ success:false,error: errormesaages[1004], errorcode: 1004 });
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
      return res.status(400).json({success:false, error: errormesaages[1004], errorcode: 1004 });
    }
    res.status(200).json({ success: true, message: "Receptionist status updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const sendReceptionistOtpForLogin = async (req, res) => {
  const { mobile_number } = req.body;
  const otp = "1234";

  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    }


    const receptionist = await Receptionist.findOneAndUpdate(
      { mobile_number },
      { mobile_number, otp},
    );

    if (!receptionist) {
      return res.status(404).json({ success: false, message: 'Receptionist not found' });
    }

    if (!receptionist.otpVerified) {
      return res.status(400).json({ success: false, message: 'Your mobile number is not verified' });
    }
    if(!receptionist.verify){
      return res.status(400).json({ success: false, message: 'you are not verified by admin,contact admin' });
    
    }
    if (receptionist.block) {
      return res.status(400).json({ success: false, message: 'You are blocked by admin, contact admin' });
    }

    await receptionist.save();

    // Code to send OTP via SMS
    // sendOtpSms(mobile_number, otp); // Uncomment and implement this function

    res.status(200).json({ success: true, message: 'OTP sent successfully and clinic set', receptionist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const sendReceptionistOtp = async (req, res) => {
  const { mobile_number, clinicId } = req.body;
  const otp = "1234";

  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    }
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
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    }
    if(!otp||otp===""){
      return res.status(400).json({ success: false, message: 'otp is required and cannot be empty' });

    }
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
    const { recently_joined, onleave, page = 1, limit = 10 } = req.query;

    let receptionistQuery = { clinic: id };

    if (recently_joined === 'true') {
      receptionistQuery.verify = false;
    }

    if (onleave === 'true') {
      receptionistQuery.availability = 'onleave'; 
    }

    const totalReceptionists = await Receptionist.countDocuments(receptionistQuery);
    const totalPages = Math.ceil(totalReceptionists / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const receptionists = await Receptionist.find(receptionistQuery)
      .limit(limit)
      .skip(startIndex)
      .populate('clinic');

    if (!receptionists.length) {
      return res.status(404).json({success:true, message: 'No receptionists found for this clinic' });
    }

    res.status(200).json({
      success: true,
      message: 'Fetched receptionists successfully',
      receptionists,
      totalCount: totalReceptionists,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      startIndex: startIndex + 1,
      endIndex: endIndex > totalReceptionists ? totalReceptionists : endIndex,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching receptionists:', error);
    res.status(500).json({ message: 'Error fetching receptionists', error });
  }
};


const blockOrUnblockReceptionist = async (req, res) => {
  const { id } = req.params;
  const { block, reason } = req.body;

  try {
    let receptionist;
    if (block) {
      receptionist = await Receptionist.findByIdAndUpdate(id, { block: true, block_reason: reason }, { new: true });
    } else {
      receptionist = await Receptionist.findByIdAndUpdate(id, { block: false, unblock_reason: reason }, { new: true });
    }

    if (!receptionist) {
      return res.status(404).json({ error: 'Receptionist not found' });
    }

    const action = block ? 'blocked' : 'unblocked';
    res.json({ success: true, message: `Receptionist ${action} successfully`, receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
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
  getReceptionistsByClinic,
  blockOrUnblockReceptionist,
  sendReceptionistOtpForLogin
};
