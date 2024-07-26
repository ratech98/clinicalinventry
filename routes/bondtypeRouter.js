// routes/stateRoutes.js

const express = require('express');
const { createbondtype, getAllbondtypes, getbondtypeById, updatebondtype, deletebondtype } = require('../controller/bondtype');
const { isAuth } = require('../config/auth');
const router = express.Router();

router.post('/bondtype',isAuth, createbondtype);

router.get('/allbondtype', getAllbondtypes);

router.get('/bondtype/:id',isAuth, getbondtypeById);

router.put('/bondtype/:id',isAuth, updatebondtype);



module.exports = router; 
