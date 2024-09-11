const express = require('express');
const { addPatient, getAllPatients, getPatientById, updatePatient, deletePatient, getPatients, sendPatientOtp, verifyPatientOtp, updateAppointmentWithPrescription, getPrescription, todayappointment, addAppointmentWithToken, addFollowUpAppointment, getPatientsWithTodayAppointments, upload_diagnose_report, get_diagnose_report, getFollowUpList, getAllPatientslist, getAllrelationlist, resendOtp, downloadpdf } = require('../controller/patientController');
const { isAuth } = require('../config/auth');
const { connectTenantDB } = require('../config/db');
const { sendDoctorOtp } = require('../controller/doctorController');
const router = express.Router();
const multer = require('multer');

const multerStorage = multer.memoryStorage(); 
const upload = multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
      console.log("file found");
      cb(null, true);
    }
  }).single('diagnose_report');

router.post('/patients',isAuth,connectTenantDB, addPatient);
router.get('/patients',isAuth,connectTenantDB, getAllPatients);
router.get('/patientslist',isAuth,connectTenantDB, getAllPatientslist);
router.get('/relationlist',isAuth,connectTenantDB, getAllrelationlist);

router.get('/patients/doctor/:doctor',isAuth,connectTenantDB, getPatients);
router.get('/patients/:id',isAuth,connectTenantDB, getPatientById);
router.put('/patients/:id',isAuth,connectTenantDB, updatePatient);
router.delete('/patients/:id',isAuth,connectTenantDB, deletePatient);
router.post('/sendotp/patient',isAuth,connectTenantDB,sendPatientOtp)
router.post('/verifyotp/patient',isAuth,connectTenantDB,verifyPatientOtp)
router.post('/appointment/prescription',isAuth,connectTenantDB,updateAppointmentWithPrescription)
router.get('/appointment/prescription',isAuth,connectTenantDB,getPrescription)
router.post('/add_appointment',isAuth,connectTenantDB,addAppointmentWithToken)
router.post('/followup/appointment',isAuth,connectTenantDB,addFollowUpAppointment)
router.get('/patientsappointment/:doctor', isAuth,connectTenantDB,getPatientsWithTodayAppointments);
  
router.post('/upload_diagnose_report/:patientId',isAuth,connectTenantDB, upload,upload_diagnose_report );

router.get('/diagnose_reports/:patientId',isAuth,connectTenantDB,get_diagnose_report );

router.get('/followuplist',isAuth,connectTenantDB,getFollowUpList)
  
router.post('/resendotp/patient',isAuth,connectTenantDB,resendOtp)

router.get('/download_pdf/:patientId/:appointmentId',isAuth,connectTenantDB,downloadpdf)
module.exports=router
