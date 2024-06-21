const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  mobile_number: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    type: String,
    required: true,
  },

},{timestamps:true}
);

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
