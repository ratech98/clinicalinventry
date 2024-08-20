// routes/stateRoutes.js

const express = require('express');
const { createbondtype, getAllbondtypes, getbondtypeById, updatebondtype, deletebondtype } = require('../controller/bondtype');
const { isAuth } = require('../config/auth');
const router = express.Router();

router.post('/bondtype', createbondtype);

router.get('/allbondtype', getAllbondtypes);

router.get('/bondtype/:id', getbondtypeById);

router.put('/bondtype/:id', updatebondtype);



module.exports = router; 
