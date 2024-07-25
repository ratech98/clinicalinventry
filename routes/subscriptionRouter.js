const express = require('express');
const { addSubscriptionTitle, getSubscriptionTitles, getSubscriptionTitleById, updateSubscriptionTitle, deleteSubscriptionTitle, addSubscriptionDuration, getSubscriptionDurations, getSubscriptionDurationById, updateSubscriptionDuration, deleteSubscriptionDuration, addSubscriptionFeature, getSubscriptionFeatures, getSubscriptionFeatureById, updateSubscriptionFeature, deleteSubscriptionFeature } = require('../controller/subscriptionController');
const { isAuth } = require('../config/auth');
const router = express.Router();


router.post('/subscription_Title',isAuth, addSubscriptionTitle);

router.get('/subscription_Title',isAuth, getSubscriptionTitles);

router.get('/subscription_Title/:id',isAuth, getSubscriptionTitleById);

router.put('/subscription_Title/:id',isAuth, updateSubscriptionTitle);

router.delete('/subscription_Title/:id',isAuth, deleteSubscriptionTitle);


router.post('/subscription_durations',isAuth, addSubscriptionDuration);

router.get('/subscription_durations',isAuth, getSubscriptionDurations);

router.get('/subscription_durations/:id',isAuth, getSubscriptionDurationById);

router.put('/subscription_durations/:id',isAuth, updateSubscriptionDuration);

router.delete('/subscription_durations/:id',isAuth, deleteSubscriptionDuration);


router.post('/subscription_feature',isAuth, addSubscriptionFeature);

router.get('/subscription_feature',isAuth, getSubscriptionFeatures);

router.get('/subscription_feature/:id',isAuth, getSubscriptionFeatureById);

router.put('/subscription_feature/:id',isAuth, updateSubscriptionFeature);

router.delete('/subscription_feature/:id',isAuth, deleteSubscriptionFeature);




module.exports = router;
