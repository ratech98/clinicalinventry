const express = require('express');
const { addDoctor, getAllDoctors, getDoctorById, updateDoctor, deleteDoctor, updateDoctorAvailabilitty, updateDoctorVerify, addClinicToDoctor, addAvailability, updateAvailability, getClinicDetailsByDoctorId } = require('../controller/doctorController');
const { isAuth } = require('../config/auth');
const router = express.Router();


router.post('/doctors', addDoctor);
router.get('/doctors', getAllDoctors);
router.get('/doctors/clinic', getClinicDetailsByDoctorId);
router.get('/doctors/:id', getDoctorById);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.put('/doctors/status/:id', updateDoctorAvailabilitty);
router.put('/doctors/verify/:id', updateDoctorVerify);
router.post('/update_clinic_to_doctor',addClinicToDoctor)
router.post('/adddoctor_availablity',addAvailability)
router.put('/updatedoctor_availablity',updateAvailability)



module.exports=router
