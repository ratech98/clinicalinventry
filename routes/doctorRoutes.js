const express = require('express');
const { addDoctor, getAllDoctors, getDoctorById, updateDoctor, deleteDoctor, updateDoctorAvailabilitty, updateDoctorVerify, addClinicToDoctor, addAvailability, updateAvailability, getClinicDetailsByDoctorId, sendDoctorOtp, verifyDoctorOtp, verifyDoctorClinic, updateDoctorAvailability, addDoctorAvailability, blockOrUnblockDoctor } = require('../controller/doctorController');
const { isAuth } = require('../config/auth');
const router = express.Router();
const multer = require('multer');

const multerStorage = multer.memoryStorage(); 

const upload = multer({
  storage: multerStorage,
}).fields([
  { name: 'undergraduate_certificate', maxCount: 1 },
  { name: 'postgraduate_certificate', maxCount: 1 },
 
]);


router.post('/doctors', addDoctor);
router.get('/doctors', getAllDoctors);
router.get('/doctors/clinic', getClinicDetailsByDoctorId);
router.get('/doctors/:id', getDoctorById);
router.put('/doctors/:id',upload, updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.put('/doctors/status/:id', updateDoctorAvailability);
router.put('/doctors/verify/clinic', verifyDoctorClinic);
router.post('/update_clinic_to_doctor',addClinicToDoctor)
router.post('/adddoctor_availablity',addDoctorAvailability)
router.put('/updatedoctor_availablity',updateDoctorAvailabilitty)
router.post('/sendotp/doctor',sendDoctorOtp)
router.post('/verifyotp/doctor',verifyDoctorOtp)
router.post('/doctor/:id',blockOrUnblockDoctor)



module.exports=router
