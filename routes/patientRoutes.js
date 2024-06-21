const express = require('express');
const { addPatient, getAllPatients, getPatientById, updatePatient, deletePatient, getPatients } = require('../controller/patientController');
const { isAuth } = require('../config/auth');
const { connectTenantDB } = require('../config/db');
const router = express.Router();


router.post('/patients',isAuth,connectTenantDB, addPatient);
router.get('/patients',isAuth,connectTenantDB, getAllPatients);
router.get('/patients/doctor',isAuth,connectTenantDB, getPatients);
router.get('/patients/:id',isAuth,connectTenantDB, getPatientById);
router.put('/patients/:id',isAuth,connectTenantDB, updatePatient);
router.delete('/patients/:id',isAuth,connectTenantDB, deletePatient);



module.exports=router
