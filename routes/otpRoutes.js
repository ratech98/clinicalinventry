const express = require('express');
const { sendOtp, verifyOtp, generateToken, loginsendOtp, resendOtp } = require('../controller/otpController');
const router = express.Router();


router.post('/sendotp', sendOtp);
router.post('/verifyotp', verifyOtp);
router.post('/generate_token',generateToken)
router.put('/login',loginsendOtp)
router.post('/resendotp/clinic',resendOtp)

module.exports=router