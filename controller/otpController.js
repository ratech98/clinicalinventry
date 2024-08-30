// const twilio = require('twilio');
const dotenv = require('dotenv');
const { generateOtp, generate6DigitOtp } = require('../lib/generateOtp');
const { signInToken } = require('../config/auth');
const Clinic = require('../modal/clinic.');
const { errormesaages } = require('../errormessages');
const doctor = require('../modal/doctor');
const { createNotification } = require('../lib/notification');
const sendEmail = require('../lib/sendEmail');
dotenv.config();

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = twilio(accountSid, authToken);

const sendOtp = async (req, res) => {
  const { mobile_number,email } = req.body;
  const OTP = generate6DigitOtp();

  try {
    let clinic = await Clinic.findOne({ email });
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({  success: false,  message: errormesaages[1008], errorcode: 1008  });
    }
    
    if (clinic) {
    console.log("enrty")

    return res.status(400).json({  success: false,  message: errormesaages[1030], errorcode: 1030  });

    } else {
      clinic = new Clinic({
        mobile_number,
        otp:OTP,
        otpVerified: false, 
        block: false,
        email:email
      });
    }
    const templateFile = 'OTP.ejs';
    const subject = 'Di application OTP Verification';
    console.log("otp", OTP);

    const data = {
      otp: OTP,
    };
    sendEmail(
      email,
      subject,
      templateFile,
      data,
    );
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
  const { email } = req.body;
  const otp = generate6DigitOtp()

  try {
    let clinic = await Clinic.findOne({ email });

console.log(clinic)
   
    if (clinic) {
    console.log("enrty")


      if(clinic.block){
        return res.status(400).json({  success: false,  message: errormesaages[1042], errorcode: 1042 });
  
      }

      clinic.otp = otp;
      await clinic.save();
    } else {
      return res.status(404).json({ success: false, message: errormesaages[1001], errorcode: 1001 });

    }

    const templateFile = 'OTP.ejs';
    const subject = 'Di application OTP Verification';

    const data = {
      otp: otp,
    };
    sendEmail(
      email,
      subject,
      templateFile,
      data,
    );
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
  const { email, otp } = req.body;

  try {
    if (!otp || otp.trim() === '') {
      return res.status(400).json({ success: false, message: errormesaages[1015], errorcode: 1015 });
    }

    const clinic = await Clinic.findOne({ email: email });
    console.log(clinic,email,otp)
    if (!clinic) {
      return res.status(404).json({ success: false, message: errormesaages[1001], errorcode: 1001 });
    }

    if (clinic.block) {
      return res.status(403).send({ success: false, message: errormesaages[1042], block_reason: clinic.block_reason, errorcode: 1042 });
    }

    if (otp !== clinic.otp) {
      return res.status(400).json({ success: false, message: errormesaages[1016], errorcode: 1016 });
    }

    clinic.otpVerified = true;
    await clinic.save();

    const token = signInToken(clinic);

    res.status(200).json({ success: true, message: 'OTP verified successfully', token, clinic });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


const generateToken = async (req, res) => {
  const { clinicId, doctorId } = req.body;

  try {
    const doctors = await doctor.findOne({
      _id: doctorId,
      'clinics.clinicId': clinicId
    });
    
    console.log("doctors", doctors);
    
    if (!doctors) {
      return res.status(404).json({ success: false, message: 'Doctor with the specified clinicId not found' });
    }

    const clinicDetails = doctors.clinics.filter(clinic => clinic.clinicId.toString() === clinicId);

    if (!clinicDetails.length) {
      return res.status(404).json({ success: false, message: 'Clinic details not found' });
    }

    const doctordata = {
      _id: doctors._id,
      name: doctors.name,
      mobile_number: doctors.mobile_number,
      clinics: clinicDetails,
      type: "doctor"
    };

    const token = signInToken(doctordata);

    res.status(200).json({ success: true, message: "Token generated successfully", doctordata, token });
  } catch (error) {
    console.error('Error fetching clinic details:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};



const resendOtp = async (req, res) => {
  const { email } = req.body;
  const OTP = generate6DigitOtp();

  try {
    let clinic = await Clinic.findOne({ email });

    if (!clinic) {
      return res.status(404).json({ success: false, message:errormesaages[1001], errorcode: 1001 });
    }

    clinic.otp = OTP;
    // clinic.otpVerified = false;

    const templateFile = 'OTP.ejs';
    const subject = 'Di application OTP Verification';

    const data = { otp: OTP };
    sendEmail(email, subject, templateFile, data);

    await clinic.save();

    console.log("OTP resent", OTP);

    return res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  sendOtp,
  verifyOtp,
  generateToken,
  loginsendOtp,
  resendOtp
};
