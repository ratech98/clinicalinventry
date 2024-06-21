const express = require('express');
const { addClinic, getAllClinics, getClinicById, updateClinic, deleteClinic, verify_clinic, getClinics } = require('../controller/clinicController');
const router = express.Router();


router.post('/addclinic', addClinic);
router.get('/clinics', getAllClinics);

router.get('/clinics/:id', getClinicById);
router.put('/clinics/:id', updateClinic);
router.delete('/clinics/:id', deleteClinic);
router.put('/verify-admin/:id', verify_clinic);
  
  



module.exports=router
