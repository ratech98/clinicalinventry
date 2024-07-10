const express = require('express');
const { addClinic, getAllClinics, getClinicById, updateClinic, deleteClinic, verify_clinic, getClinics, getDoctorsAndAvailabilityByClinic, blockOrUnblockClinic, verify_clinic_certificate, getClinicId } = require('../controller/clinicController');
const router = express.Router();

const multer = require('multer');
const { isAuth } = require('../config/auth');

const multerStorage = multer.memoryStorage(); 
const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    console.log("file found");
    cb(null, true);
  }
}).single('certificate');
router.post('/addclinic', addClinic);
router.get('/clinics', getAllClinics);

router.get('/clinic',isAuth, getClinicById);
router.get('/clinic/:id', getClinicId);
router.put('/clinics/:id',upload, updateClinic);
router.delete('/clinics/:id', deleteClinic);
router.put('/verify-admin/:id', verify_clinic);
router.put('/verify_clinic/:id', verify_clinic_certificate);
router.get('/doctersby_clinic/:id',getDoctorsAndAvailabilityByClinic)
router.post('/clinic/:id',blockOrUnblockClinic)
  
  



module.exports=router
