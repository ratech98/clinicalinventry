// const twilio = require('twilio');
const dotenv = require('dotenv');
const { generateOtp } = require('../lib/generateOtp');
const { signInToken } = require('../config/auth');
const Clinic = require('../modal/clinic.');
const { errormesaages } = require('../errormessages');
const doctor = require('../modal/doctor');
dotenv.config();

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = twilio(accountSid, authToken);

const sendOtp = async (req, res) => {
  const { mobile_number } = req.body;
  const otp = "123456"; // You can generate a random OTP here

  try {
    let clinic = await Clinic.findOne({ mobile_number });
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({  success: false,  message: errormesaages[1008], errorcode: 1008  });
    }
    
    if (clinic) {
    console.log("enrty")

    return res.status(400).json({  success: false,  message: errormesaages[1030], errorcode: 1030  });

    } else {
      clinic = new Clinic({
        mobile_number,
        otp,
        otpVerified: false, 
        block: false,
      });
    }

    await clinic.save();

    // const response = await axios.post('https://api.creativepoint.com/send', {
    //   api_key: process.env.CREATIVEPOINT_API_KEY,
    //   sender_id: process.env.CREATIVEPOINT_SENDER_ID,
    //   mobile_number: mobile_number,
    //   message: `Your OTP code is ${otp}`,
    // });
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const loginsendOtp = async (req, res) => {
  const { mobile_number } = req.body;
  const otp = "123456"; 

  try {
    let clinic = await Clinic.findOne({ mobile_number });
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({  success: false,  message: errormesaages[1008], errorcode: 1008  });
    }
    if (clinic) {
    console.log("enrty")


      clinic.otp = otp;
    } else {
      return res.status(400).json({ success: false, message: 'Mobile number not exist' });

    }

    await clinic.save();

    // const response = await axios.post('https://api.creativepoint.com/send', {
    //   api_key: process.env.CREATIVEPOINT_API_KEY,
    //   sender_id: process.env.CREATIVEPOINT_SENDER_ID,
    //   mobile_number: mobile_number,
    //   message: `Your OTP code is ${otp}`,
    // });
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const verifyOtp = async (req, res) => {
  const { mobile_number, otp } = req.body;

  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success:false,message: errormesaages[1008], errorcode: 1008});
    }
    if(!otp||otp===""){
      return res.status(400).json({ success: false, message: errormesaages[1015], errorcode: 1015 });

    }
    const clinic = await Clinic.findOne({ mobile_number });

    if (!clinic) {
      return res.status(404).json({ success:false,message: errormesaages[1001], errorcode: 1001 });
    }

    if (otp !== clinic.otp) {
      return res.status(400).json({ success:false,message: errormesaages[1016], errorcode: 1016 });
    }

    clinic.otpVerified = true;
    await clinic.save();

    const token = signInToken(clinic);

    res.status(200).json({success:true, message: 'OTP verified successfully', token, clinic });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateToken = async (req, res) => {
  const { clinicId, doctorId } = req.body;

  try {
    const doctors = await doctor.findOne({
      _id: doctorId,
      'clinics.clinicId': clinicId
    });

    if (!doctors) {
      return res.status(404).json({ success: false, message: 'Doctor with the specified clinicId not found' });
    }

    const clinicDetails = doctors.clinics.find(clinic => clinic.clinicId.toString() === clinicId);

    if (!clinicDetails) {
      return res.status(404).json({ success: false, message: 'Clinic details not found' });
    }

    const doctordata = {
      _id: doctors._id,
      name: doctors.name,
      mobile_number: doctors.mobile_number,
      clinics: [clinicDetails],
    };

    const token = signInToken(doctordata);

    res.status(200).json({ success: true,message:"token generated succesfully", doctordata, token });
  } catch (error) {
    console.error('Error fetching clinic details:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


module.exports = {
  sendOtp,
  verifyOtp,
  generateToken,
  loginsendOtp
};
