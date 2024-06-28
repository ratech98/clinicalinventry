const express = require('express');
const { addPatient, getAllPatients, getPatientById, updatePatient, deletePatient, getPatients, sendPatientOtp, verifyPatientOtp, updateAppointmentWithPrescription, getPrescription, todayappointment, addAppointmentWithToken, addFollowUpAppointment, getPatientsWithTodayAppointments } = require('../controller/patientController');
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
router.post('/appointment/prescription',isAuth,connectTenantDB,updateAppointmentWithPrescription)
router.get('/appointment/prescription',isAuth,connectTenantDB,getPrescription)
router.post('/add_appointment',isAuth,connectTenantDB,addAppointmentWithToken)
router.post('/followup/appointment',isAuth,connectTenantDB,addFollowUpAppointment)
router.get('/patients/today', isAuth,connectTenantDB,getPatientsWithTodayAppointments);
  



module.exports=router
