const express = require('express');
const { connectTenantDB } = require('../config/db');
const { isAuth } = require('../config/auth');
const { addSMSType, getAllSMSTypes, getSMSTypeById, updateSMSType, deleteSMSType, addSMSTemplate, getAllSMSTemplates, getSMSTemplateById, updateSMSTemplate, deleteSMSTemplate } = require('../controller/smstemplate');
const router = express.Router();


router.post('/sms_type',isAuth,connectTenantDB, addSMSType);
router.get('/sms_type',isAuth,connectTenantDB, getAllSMSTypes);
router.get('/sms_type/:id',isAuth,connectTenantDB, getSMSTypeById);
router.put('/sms_type/:id',isAuth,connectTenantDB, updateSMSType);
router.delete('/sms_type/:id',isAuth,connectTenantDB, deleteSMSType);

router.post('/sms_template',isAuth,connectTenantDB, addSMSTemplate);
router.get('/sms_template',isAuth,connectTenantDB, getAllSMSTemplates);
router.get('/sms_template/:id',isAuth,connectTenantDB, getSMSTemplateById);
router.put('/sms_template/:id',isAuth,connectTenantDB, updateSMSTemplate);
router.delete('/sms_template/:id',isAuth,connectTenantDB, deleteSMSTemplate);

module.exports=router