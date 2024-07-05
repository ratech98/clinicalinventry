const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clinicSubSchema = new Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  }
});

const doctorSchema = new Schema({
  name: {
    type: String,
    required: false,
  },

  specialist: {
    type: String,
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
  clinics: {
    type: [clinicSubSchema],
    default: []
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
  undergraduate_certificate: {
    type: String
  },
  postgraduate_certificate: {
    type: String
  },
  undergraduate_certificate_verify:{
    type: Boolean, default: false
  },
  postgraduate_certificate_verify:{
    type: Boolean, default: false
  },
  block:{ type: Boolean, default: false },
  block_reason:{type:String,default:null},
  unblock_reason:{type:String,default:null}

}, { timestamps: true });

const doctor = mongoose.model('doctor', doctorSchema);

module.exports = doctor;
