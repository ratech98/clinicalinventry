const express = require('express');
const { sendOtp, verifyOtp, generateToken, loginsendOtp } = require('../controller/otpController');
const router = express.Router();


router.post('/sendotp', sendOtp);
router.post('/verifyotp', verifyOtp);
router.post('/generate_token',generateToken)
router.put('/login',loginsendOtp)

module.exports=router