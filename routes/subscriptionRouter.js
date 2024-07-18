const express = require('express');
const { addSubscriptionTitle, getSubscriptionTitles, getSubscriptionTitleById, updateSubscriptionTitle, deleteSubscriptionTitle, addSubscriptionDuration, getSubscriptionDurations, getSubscriptionDurationById, updateSubscriptionDuration, deleteSubscriptionDuration } = require('../controller/subscriptionController');
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





module.exports = router;
