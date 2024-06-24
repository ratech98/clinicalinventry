const express = require('express');
const { addReceptionist, getAllReceptionists, getReceptionistById, updateReceptionist, deleteReceptionist, updateReceptionistStatus, updateReceptionistVerify, addClinicToReceptionist, addReceptionistAvailability, updateReceptionistAvailability, getReceptionists, getClinicDetailsByreceptionistId, sendReceptionistOtp, verifyReceptionistOtp, getReceptionistsByClinic } = require('../controller/receptionist.');
const { updateAvailability } = require('../controller/doctorController');

const router = express.Router();


router.post('/receptionists', addReceptionist);
router.get('/receptionists', getAllReceptionists);
router.get('/clinic/receptionists',getReceptionists );
router.post('/receptionists/clinic', getClinicDetailsByreceptionistId);
router.get('/receptionists/:id', getReceptionistById);
router.put('/receptionists/:id', updateReceptionist);
router.delete('/receptionists/:id', deleteReceptionist);

router.put('/receptionists/staus/:id',updateReceptionistStatus)
router.put('/receptionists/verify/:id',updateReceptionistVerify)
router.post('/update_receptionist_clinic',addClinicToReceptionist)
router.post('/addreceptionist_avaiablity',addReceptionistAvailability)
router.put('/updatereceptionist_availablity',updateReceptionistAvailability)
router.post('/sendotp/receptionist',sendReceptionistOtp)
router.post('/verifyotp/receptionist',verifyReceptionistOtp)
router.get('/receptionist/clinic/:id',getReceptionistsByClinic)

module.exports=router
