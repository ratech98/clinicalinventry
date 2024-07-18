const express = require('express');
const { addMedicine, getAllMedicines, getMedicineById, updateMedicine, deleteMedicine, importMedicinesData } = require('../controller/medicineController');
const { connectTenantDB } = require('../config/db');
const { isAuth } = require('../config/auth');
const { addDosageForm, getAllDosageForms, updateDosageForm, deleteDosageForm, getDosageFormById } = require('../controller/dosageformController');
const { getDosageUnitById, addDosageUnit, getAllDosageUnits, updateDosageUnit, deleteDosageUnit } = require('../controller/dosageUnitController');
const router = express.Router();
const multer = require('multer');
const multerStorage = multer.memoryStorage(); // Store the file in memory
const uploadfile = multer({ storage: multerStorage }).fields([
  { name: 'file', maxCount: 1 }
]);

router.post('/medicines',isAuth,connectTenantDB, addMedicine);
router.get('/medicines',isAuth,connectTenantDB, getAllMedicines);
router.get('/medicines/:id',isAuth,connectTenantDB, getMedicineById);
router.put('/medicines/:id',isAuth,connectTenantDB, updateMedicine);
router.delete('/medicines/:id',isAuth,connectTenantDB, deleteMedicine);
router.post('/import/medicines', isAuth,connectTenantDB, uploadfile, importMedicinesData);

router.post('/dosageform',isAuth,connectTenantDB, addDosageForm);
router.get('/dosageform',isAuth,connectTenantDB, getAllDosageForms);
router.get('/dosageform/:id',isAuth,connectTenantDB, getDosageFormById);
router.put('/dosageform/:id',isAuth,connectTenantDB, updateDosageForm);
router.delete('/dosageform/:id',isAuth,connectTenantDB, deleteDosageForm);

router.post('/dosageunit',isAuth,connectTenantDB, addDosageUnit);
router.get('/dosageunit',isAuth,connectTenantDB, getAllDosageUnits);
router.get('/dosageunit/:id',isAuth,connectTenantDB, getDosageUnitById);
router.put('/dosageunit/:id',isAuth,connectTenantDB, updateDosageUnit);
router.delete('/dosageunit/:id',isAuth,connectTenantDB, deleteDosageUnit);


module.exports=router
