const express = require('express');
const { addClinic, getAllClinics, getClinicById, updateClinic, deleteClinic, verify_clinic, getClinics, getDoctorsAndAvailabilityByClinic, blockOrUnblockClinic, verify_clinic_certificate, getClinicId, update_Subscription, getsubscriptiondays } = require('../controller/clinicController');
const router = express.Router();

const multer = require('multer');
const { isAuth, verifyToken } = require('../config/auth');
const { isAdmin } = require('../config/adminAuth');

const multerStorage = multer.memoryStorage(); 
const upload = multer({
  storage: multerStorage,
}).fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'certificate2', maxCount: 1 },
  {name:'certificate3',maxCount:1}
 
]);
router.post('/addclinic',isAuth, addClinic);
router.get('/clinics',isAdmin, getAllClinics);

router.get('/clinic',verifyToken, getClinicById);
router.get('/clinic/:id',isAuth, getClinicId);
router.put('/clinics/:id',isAuth,upload, updateClinic);
router.delete('/clinics/:id',isAuth, deleteClinic);
router.put('/verify-admin/:id',isAdmin, verify_clinic);
router.put('/verify_clinic/:id',isAdmin, verify_clinic_certificate);
router.get('/doctersby_clinic/:id',isAuth,getDoctorsAndAvailabilityByClinic)
router.post('/clinic/:id',isAdmin,blockOrUnblockClinic)
router.post('/updateSubscription/:id',verifyToken, update_Subscription);
router.get('/remainingDays/:id',verifyToken, getsubscriptiondays);  
  



module.exports=router
