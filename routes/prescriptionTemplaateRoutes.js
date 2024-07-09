const express = require('express');
const { isAuth } = require('../config/auth');
const router = express.Router();
const multer = require('multer');
const { getTemplatesByClinicId, add_field_to_template, update_field_in_template, delete_field_from_template, } = require('../controller/prescriptionTemplateController');

const multerStorage = multer.memoryStorage(); 

const upload = multer({
  storage: multerStorage,
}).fields([
  
  {name:'logo',maxCount:1}
 
]);


router.get('/get_prescriptionTemplate/:clinicId',getTemplatesByClinicId)
router.post('/add_field',add_field_to_template)
router.post('/update_field',update_field_in_template)
router.delete('/delete_field/:clinicId/:section/:fieldName',delete_field_from_template)


module.exports=router