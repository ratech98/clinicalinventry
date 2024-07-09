const express = require('express');
const { isAuth } = require('../config/auth');
const router = express.Router();
const multer = require('multer');
const { getTemplatesByClinicId, add_field_to_template, update_field_in_template, delete_field_from_template, update_logo, } = require('../controller/prescriptionTemplateController');

const multerStorage = multer.memoryStorage(); 

const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        console.log("file found")
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
}).single('logo'); 


router.get('/get_prescriptionTemplate/:clinicId',getTemplatesByClinicId)
router.post('/add_field',add_field_to_template)
router.post('/update_field',update_field_in_template)
router.delete('/delete_field/:clinicId/:section/:fieldName',delete_field_from_template)
router.post('/update_logo',upload,update_logo)


module.exports=router