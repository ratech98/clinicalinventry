const express = require('express');
const { addClinic, getAllClinics, getClinicById, updateClinic, deleteClinic, verify_clinic, getClinics, getDoctorsAndAvailabilityByClinic } = require('../controller/clinicController');
const router = express.Router();

const multer = require('multer');

const multerStorage = multer.memoryStorage(); 
const upload = multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image')) {
          console.log("file found")
        cb(null, true);
      } else {
        cb(new Error('Only images are allowed'));
      }
    }
  }).single('certificate'); 
router.post('/addclinic', addClinic);
router.get('/clinics', getAllClinics);

router.get('/clinics/:id', getClinicById);
router.put('/clinics/:id',upload, updateClinic);
router.delete('/clinics/:id', deleteClinic);
router.put('/verify-admin/:id', verify_clinic);

router.get('/doctersby_clinic/:id',getDoctorsAndAvailabilityByClinic)
  
  



module.exports=router
