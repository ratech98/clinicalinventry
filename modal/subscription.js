const mongoose = require('mongoose');

const subscriptionTitleSchema = new mongoose.Schema({
    title: { type: String }
    
    
});

const SubscriptionTitle = mongoose.model('SubscriptionTitle', subscriptionTitleSchema);



const subscriptionDurationSchema = new mongoose.Schema({
    duration: { type: String, required: true,enum:['month','year','day'] },
    durationInNo:{ type: Number, required: true },
    pricePerMonth: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    feature:[{type:String}],
    title:{type: mongoose.Schema.Types.ObjectId,
        ref:"SubscriptionTitle"}
});

const SubscriptionDuration = mongoose.model('SubscriptionDuration', subscriptionDurationSchema);

const subscriptionFeatureSchema = new mongoose.Schema({
    Feature: { type: String },
    title:[{type: mongoose.Schema.Types.ObjectId,
        ref:"SubscriptionTitle"}]

    
    
});

const SubscriptionFeature = mongoose.model('SubscriptionFeature', subscriptionFeatureSchema);

module.exports = {SubscriptionDuration,SubscriptionTitle,SubscriptionFeature}
