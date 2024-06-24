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
  const otp = "1234";  

  try {
    await Clinic.findOneAndUpdate(
      { mobile_number },
      { mobile_number, otp },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // await client.messages.create({
    //   body: `Your OTP code is ${otp}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: mobile_number,
    // });

    res.status(200).json({ success:true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { mobile_number, otp } = req.body;

  try {
    const clinic = await Clinic.findOne({ mobile_number });

    if (!clinic) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (otp !== clinic.otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    clinic.otpVerified = true;
    await clinic.save();

    const token = signInToken(clinic);

    res.status(200).json({ message: 'OTP verified successfully', token, clinic });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateToken = async (req, res) => {
  const { id } = req.body;

  try {
    const clinic = await Clinic.find({_id:id});

    if (!clinic) {
      return res.status(404).json({ error: 'User not found' });
    }

   

    const token = signInToken(clinic);

    res.status(200).json({ message: 'token generated successfully', token, clinic });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  generateToken
};
