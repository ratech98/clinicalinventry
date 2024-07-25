const express = require('express');
const { addReceptionist, getAllReceptionists, getReceptionistById, updateReceptionist, deleteReceptionist, updateReceptionistStatus, updateReceptionistVerify, addClinicToReceptionist, addReceptionistAvailability, updateReceptionistAvailability, getReceptionists, getClinicDetailsByreceptionistId, sendReceptionistOtp, verifyReceptionistOtp, getReceptionistsByClinic, blockOrUnblockReceptionist, sendReceptionistOtpForLogin, verify_receptionist_certificate, getDoctorsAndAvailabilityByClinic } = require('../controller/receptionist.');
const { updateAvailability } = require('../controller/doctorController');

const router = express.Router();
const multer = require('multer');
const { isAuth } = require('../config/auth');
const { connectTenantDB } = require('../config/db');

const multerStorage = multer.memoryStorage(); 
const upload = multer({
  storage: multerStorage,
}).fields([
  { name: 'certificate', maxCount: 1 },

  {name:'profile',maxCount:1}
 
]);

router.post('/receptionists',isAuth, addReceptionist);
router.get('/receptionists',isAuth, getAllReceptionists);
router.get('/clinic/receptionists',isAuth,getReceptionists);
router.post('/receptionists/clinic',isAuth, getClinicDetailsByreceptionistId);
router.get('/receptionists/:id',isAuth, getReceptionistById);
router.put('/receptionists/:id',upload,isAuth, updateReceptionist);
router.delete('/receptionists/:id',isAuth, deleteReceptionist);

router.put('/receptionists/staus/:id',isAuth,updateReceptionistStatus)
router.put('/receptionists/verify/:id',isAuth,updateReceptionistVerify)
// router.post('/update_receptionist_clinic',addClinicToReceptionist)


router.post('/sendotp/receptionist',isAuth,sendReceptionistOtp)
router.post('/sendotp/receptionist/login',isAuth,sendReceptionistOtpForLogin)
router.post('/verifyotp/receptionist',isAuth,verifyReceptionistOtp)
router.get('/receptionist/clinic/:id',isAuth,getReceptionistsByClinic)
router.post('/receptionist/:id',isAuth,blockOrUnblockReceptionist)

router.put('/verify/receptionist/certificate/:id',isAuth, verify_receptionist_certificate);


      
router.get('/doctersby_clinic/token/:id',isAuth,connectTenantDB,getDoctorsAndAvailabilityByClinic);
module.exports=router
 