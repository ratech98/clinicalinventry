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
  

}, { timestamps: true });

const Receptionist = mongoose.model('Receptionist', receptionistSchema);

module.exports = Receptionist;
