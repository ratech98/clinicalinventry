const express = require('express');
const { getNotifications, readnotification } = require('../controller/notificationController');
const router = express.Router();


router.get('/getnotifications',getNotifications)
router.put('/notification/read/:id',readnotification)


module.exports=router