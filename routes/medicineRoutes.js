const express = require('express');
const { addMedicine, getAllMedicines, getMedicineById, updateMedicine, deleteMedicine } = require('../controller/medicineController');
const { connectTenantDB } = require('../config/db');
const { isAuth } = require('../config/auth');
const router = express.Router();


router.post('/medicines',isAuth,connectTenantDB, addMedicine);
router.get('/medicines',isAuth,connectTenantDB, getAllMedicines);
router.get('/medicines/:id',isAuth,connectTenantDB, getMedicineById);
router.put('/medicines/:id',isAuth,connectTenantDB, updateMedicine);
router.delete('/medicines/:id',isAuth,connectTenantDB, deleteMedicine);



module.exports=router
