const express = require('express');
const { addSubscriptionTitle, getSubscriptionTitles, getSubscriptionTitleById, updateSubscriptionTitle, deleteSubscriptionTitle, addSubscriptionDuration, getSubscriptionDurations, getSubscriptionDurationById, updateSubscriptionDuration, deleteSubscriptionDuration, addSubscriptionFeature, getSubscriptionFeatures, getSubscriptionFeatureById, updateSubscriptionFeature, deleteSubscriptionFeature, getfreetrail, updatefreetrail, addfreetrail } = require('../controller/subscriptionController');
const { isAuth, verifyToken } = require('../config/auth');
const router = express.Router();


router.post('/subscription_Title',verifyToken, addSubscriptionTitle);

router.get('/subscription_Title',verifyToken, getSubscriptionTitles);

router.get('/subscription_Title/:id',verifyToken, getSubscriptionTitleById);

router.put('/subscription_Title/:id',verifyToken, updateSubscriptionTitle);

router.delete('/subscription_Title/:id',verifyToken, deleteSubscriptionTitle);


router.post('/subscription_durations',verifyToken, addSubscriptionDuration);

router.get('/subscription_durations',verifyToken, getSubscriptionDurations);

router.get('/subscription_durations/:id',verifyToken, getSubscriptionDurationById);

router.put('/subscription_durations/:id',verifyToken, updateSubscriptionDuration);

router.delete('/subscription_durations/:id',verifyToken, deleteSubscriptionDuration);


router.post('/subscription_feature',verifyToken, addSubscriptionFeature);

router.post('/freetrail', addfreetrail);

router.get('/freetrail', getfreetrail);

router.get('/subscription_feature/:id',verifyToken, getSubscriptionFeatureById);

router.put('/freetrail/:id',updatefreetrail);

router.delete('/subscription_feature/:id',verifyToken, deleteSubscriptionFeature);




module.exports = router;
