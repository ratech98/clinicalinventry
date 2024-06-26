const express = require('express');
const { addReceptionist, getAllReceptionists, getReceptionistById, updateReceptionist, deleteReceptionist, updateReceptionistStatus, updateReceptionistVerify, addClinicToReceptionist, addReceptionistAvailability, updateReceptionistAvailability, getReceptionists, getClinicDetailsByreceptionistId, sendReceptionistOtp, verifyReceptionistOtp, getReceptionistsByClinic, blockOrUnblockReceptionist } = require('../controller/receptionist.');
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
// router.post('/update_receptionist_clinic',addClinicToReceptionist)

router.post('/sendotp/receptionist',sendReceptionistOtp)
router.post('/verifyotp/receptionist',verifyReceptionistOtp)
router.get('/receptionist/clinic/:id',getReceptionistsByClinic)
router.post('/receptionist/:id',blockOrUnblockReceptionist)

module.exports=router
