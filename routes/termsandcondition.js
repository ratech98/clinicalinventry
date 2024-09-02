const express = require('express');
const { createterms_and_conditions, getAllterms_and_conditionss, updateterms_and_conditions, createaboutus, getAllabout_us, createhelpandsupport, getAllhelpandsupport } = require('../controller/termandconditionController');

const router = express.Router();

router.post('/addterms_and_condition',createterms_and_conditions)

router.get('/getterms_and_conditions',getAllterms_and_conditionss)

router.put('/updateterms_and_conditions/:id',updateterms_and_conditions)

router.post('/addabout_us',createaboutus)

router.get('/getabout_us',getAllabout_us)

router.post('/addhelpandsupport',createhelpandsupport)

router.get('/gethelpandsupport',getAllhelpandsupport)


module.exports=router