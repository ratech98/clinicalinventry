const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const receptionistSchema = new Schema({
  name: {
    type: String,
    required: false,
  },
  availability: {
    type: String,
    enum: ["available", "onleave"],
    default: "available"
  },
  mobile_number: {
    type: Number
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  verify: {
    type: Boolean,
    default: false
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  },
  profile: {
    type: String
  },
  qualification: {
    type: String
  },
  gender: {
    type: String
  },
  age: {
    type: String
  },
  dob: {
    type: String
  },
  otp: {
    type: String,
    required: false
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  block:{ type: Boolean, default: false },
  block_reason:{type:String,default:null},
  unblock_reason:{type:String,default:null},
  certificate: {
    type: String
  },
  certificate_verify:{
    type:Boolean,
    default:false
  },
  details:{type:Boolean,default:false},
  type:{type:String,default:"receptionist"},
  subscription:{type:Boolean,default:false},
  

}, { timestamps: true });

const Receptionist = mongoose.model('Receptionist', receptionistSchema);

module.exports = Receptionist;
