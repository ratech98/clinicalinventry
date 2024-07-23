const express = require('express');
const { addSubscriptionTitle, getSubscriptionTitles, getSubscriptionTitleById, updateSubscriptionTitle, deleteSubscriptionTitle, addSubscriptionDuration, getSubscriptionDurations, getSubscriptionDurationById, updateSubscriptionDuration, deleteSubscriptionDuration, addSubscriptionFeature, getSubscriptionFeatures, getSubscriptionFeatureById, updateSubscriptionFeature, deleteSubscriptionFeature } = require('../controller/subscriptionController');
const router = express.Router();


router.post('/subscription_Title', addSubscriptionTitle);

router.get('/subscription_Title', getSubscriptionTitles);

router.get('/subscription_Title/:id', getSubscriptionTitleById);

router.put('/subscription_Title/:id', updateSubscriptionTitle);

router.delete('/subscription_Title/:id', deleteSubscriptionTitle);


router.post('/subscription_durations', addSubscriptionDuration);

router.get('/subscription_durations', getSubscriptionDurations);

router.get('/subscription_durations/:id', getSubscriptionDurationById);

router.put('/subscription_durations/:id', updateSubscriptionDuration);

router.delete('/subscription_durations/:id', deleteSubscriptionDuration);


router.post('/subscription_feature', addSubscriptionFeature);

router.get('/subscription_feature', getSubscriptionFeatures);

router.get('/subscription_feature/:id', getSubscriptionFeatureById);

router.put('/subscription_feature/:id', updateSubscriptionFeature);

router.delete('/subscription_feature/:id', deleteSubscriptionFeature);




module.exports = router;
