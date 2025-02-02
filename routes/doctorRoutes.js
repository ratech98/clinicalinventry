const express = require('express');
const { addDoctor, getAllDoctors, getDoctorById, updateDoctor, deleteDoctor, updateDoctorAvailabilitty, updateDoctorVerify, addClinicToDoctor, addAvailability, updateAvailability, getClinicDetailsByDoctorId, sendDoctorOtp, verifyDoctorOtp, verifyDoctorClinic, updateDoctorAvailability, addDoctorAvailability, blockOrUnblockDoctor, sendDoctorOtpForLogin, get_availability, verify_certificate, addUnavailableSlots, resendOtp } = require('../controller/doctorController');
const { isAuth } = require('../config/auth');
const router = express.Router();
const multer = require('multer');

const multerStorage = multer.memoryStorage(); 

const upload = multer({
  storage: multerStorage,
}).fields([
  { name: 'undergraduate_certificate', maxCount: 1 },
  { name: 'postgraduate_certificate'},
  {name:'profile',maxCount:1},
  {name:"signature",maxCount:1}
 
]);


router.post('/doctors', addDoctor);
router.get('/doctors',isAuth, getAllDoctors);
router.get('/doctors/clinic/:id', getClinicDetailsByDoctorId);
router.get('/doctors/:id',isAuth, getDoctorById);
router.put('/doctors/:id',upload, updateDoctor);
router.delete('/doctors/:doctorId/:clinicId',isAuth, deleteDoctor);
router.put('/doctors/status',isAuth, updateDoctorAvailability);
router.put('/doctors/verify/clinic',isAuth, verifyDoctorClinic);
router.post('/update_clinic_to_doctor',isAuth,addClinicToDoctor)
router.post('/adddoctor_availablity',addDoctorAvailability)
router.put('/updatedoctor_availablity',updateDoctorAvailabilitty)
router.post('/sendotp/doctor',isAuth,sendDoctorOtp)
router.post('/sendotp/doctor/login',sendDoctorOtpForLogin)
router.post('/verifyotp/doctor',verifyDoctorOtp)
router.post('/doctor/:id',isAuth,blockOrUnblockDoctor)
router.get('/get/availability',isAuth,get_availability)
router.post('/unavaialbleslots',isAuth,addUnavailableSlots)

router.put('/verify/certificate/:id',isAuth, verify_certificate);
router.post('/resendotp/doctor',resendOtp)


module.exports=router
