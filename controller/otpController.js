// const twilio = require('twilio');
const dotenv = require('dotenv');
const { generateOtp } = require('../lib/generateOtp');
const { signInToken } = require('../config/auth');
const Clinic = require('../modal/clinic.');
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
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    }
    
    if (clinic) {
    console.log("enrty")
//       if (clinic.block) {
//         return res.status(400).json({ success: false, message: 'Clinic is blocked, contact admin' });
//       }
// if(!clinic.adminVerified){
//   return res.status(400).json({ success: false, message: 'Clinic  not verified' });

// }
//       if (!clinic.otpVerified) {
//         return res.status(400).json({ success: false, message: 'Clinic mobile number is not verified' });
//       }
return res.status(400).json({ success: false, message: 'clinic with this Mobile number already exist' });

    } else {
      clinic = new Clinic({
        mobile_number,
        otp,
        otpVerified: false, 
        block: false,
      });
    }

    await clinic.save();

    // Code to send OTP via SMS
    // await client.messages.create({
    //   body: `Your OTP code is ${otp}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: mobile_number,
    // });

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const loginsendOtp = async (req, res) => {
  const { mobile_number } = req.body;
  const otp = "123456"; // You can generate a random OTP here

  try {
    let clinic = await Clinic.findOne({ mobile_number });
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    }
    if (clinic) {
    console.log("enrty")
//       if (clinic.block) {
//         return res.status(400).json({ success: false, message: 'Clinic is blocked, contact admin' });
//       }
// if(!clinic.adminVerified){
//   return res.status(400).json({ success: false, message: 'Clinic  not verified' });

// }
//       if (!clinic.otpVerified) {
//         return res.status(400).json({ success: false, message: 'Clinic mobile number is not verified' });
//       }

      clinic.otp = otp;
    } else {
      return res.status(400).json({ success: false, message: 'Mobile number not exist' });

    }

    await clinic.save();

    // Code to send OTP via SMS
    // await client.messages.create({
    //   body: `Your OTP code is ${otp}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: mobile_number,
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
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    }
    if(!otp||otp===""){
      return res.status(400).json({ success: false, message: 'otp is required and cannot be empty' });

    }
    const clinic = await Clinic.findOne({ mobile_number });

    if (!clinic) {
      return res.status(404).json({success:false, error: 'User not found' });
    }

    if (otp !== clinic.otp) {
      return res.status(400).json({success:false, error: 'Invalid OTP' });
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
  const { id } = req.body;

  try {
    const clinic = await Clinic.find({_id:id});

    if (!clinic) {
      return res.status(404).json({success:false, error: 'User not found' });
    }

   

    const token = signInToken(clinic);

    res.status(200).json({sucess:true, message: 'token generated successfully', token, clinic });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  generateToken,
  loginsendOtp
};
