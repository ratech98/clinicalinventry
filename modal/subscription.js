const mongoose = require('mongoose');

const subscriptionTitleSchema = new mongoose.Schema({
    title: { type: String }
    
    
});

const SubscriptionTitle = mongoose.model('SubscriptionTitle', subscriptionTitleSchema);



const subscriptionDurationSchema = new mongoose.Schema({
    duration: { type: String, required: true,enum:['month','year'] },
    durationInNo:{ type: Number, required: true },
    pricePerMonth: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    title:{type: mongoose.Schema.Types.ObjectId,
        ref:"SubscriptionTitle"}
});

const SubscriptionDuration = mongoose.model('SubscriptionDuration', subscriptionDurationSchema);

module.exports = {SubscriptionDuration,SubscriptionTitle}
