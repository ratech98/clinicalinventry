const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const prescriptionSchema = new Schema({
  provisional_diagnosis: { type: String },
  advice: { type: String },
  clinical_notes: { type: String },
  date: { type: String },
  observation: { type: String },
  investigation_with_reports: { type: String }
});

const appointmentSchema = new Schema({
  appointment_date: { type: String },
  time: { type: String }, // Added time field
  reason: { type: String },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  prescription: prescriptionSchema,
});

const patientSchema = new Schema({
  name: { type: String, required: false },
  mobile_number: { type: String },
  address: { type: String },
  appointment_history: [appointmentSchema],
  gender: { type: String },
  age: { type: String },
  dob: { type: String },
  otp: { type: String },
  otpVerified: { type: Boolean, default: false },
  temp: { type: String },
  Bp: { type: String },
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
