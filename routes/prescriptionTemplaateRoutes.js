const express = require('express');
const { isAuth } = require('../config/auth');
const router = express.Router();
const multer = require('multer');
const { getTemplatesByClinicId, createTemplate, updateTemplate } = require('../controller/prescriptionTemplateController');

const multerStorage = multer.memoryStorage(); 

const upload = multer({
  storage: multerStorage,
}).fields([
  
  {name:'logo',maxCount:1}
 
]);


router.get('/get_prescriptionTemplate/:clinicId',getTemplatesByClinicId)
router.post('/add_prescriptionTemplate',createTemplate)
router.post('/update_prescriptionTemplate/:templateId',updateTemplate)


module.exports=router