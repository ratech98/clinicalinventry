const express = require('express');
const { addPatient, getAllPatients, getPatientById, updatePatient, deletePatient, getPatients, sendPatientOtp, verifyPatientOtp } = require('../controller/patientController');
const { isAuth } = require('../config/auth');
const { connectTenantDB } = require('../config/db');
const { sendDoctorOtp } = require('../controller/doctorController');
const router = express.Router();


router.post('/patients',isAuth,connectTenantDB, addPatient);
router.get('/patients',isAuth,connectTenantDB, getAllPatients);
router.get('/patients/doctor',isAuth,connectTenantDB, getPatients);
router.get('/patients/:id',isAuth,connectTenantDB, getPatientById);
router.put('/patients/:id',isAuth,connectTenantDB, updatePatient);
router.delete('/patients/:id',isAuth,connectTenantDB, deletePatient);
router.post('/sendotp/patient',isAuth,connectTenantDB,sendPatientOtp)
router.post('/verifyotp/patient',isAuth,connectTenantDB,verifyPatientOtp)



module.exports=router
