const express = require('express');
const { getNotifications, readnotification, deleteNotifications } = require('../controller/notificationController');
const { isAuth, verifyToken } = require('../config/auth');
const router = express.Router();


router.get('/getnotifications',verifyToken,getNotifications)
router.put('/notification/read/:id',verifyToken,readnotification)

router.post('/deletenotification',verifyToken,deleteNotifications)


module.exports=router