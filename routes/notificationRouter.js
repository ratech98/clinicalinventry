const express = require('express');
const { getNotifications, readnotification, deleteNotifications } = require('../controller/notificationController');
const { isAuth } = require('../config/auth');
const router = express.Router();


router.get('/getnotifications',isAuth,getNotifications)
router.put('/notification/read/:id',isAuth,readnotification)

router.post('/deletenotification',isAuth,deleteNotifications)


module.exports=router