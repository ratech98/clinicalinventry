const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Medicine schema
const medicineSchema = new Schema({
  name: { type: String, required: true },
  dosage: { type: String },
  timings: {
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    evening: { type: Boolean, default: false },
    beforeFood: { type: Boolean, default: false },
    afterFood: { type: Boolean, default: false }
  }
});

// Prescription schema
const prescriptionSchema = new Schema({
  provisional_diagnosis: { type: String },
  advice: { type: String },
  clinical_notes: { type: String },
  date: { type: String },
  observation: { type: String },
  investigation_with_reports: { type: String }
});

// Appointment schema
const appointmentSchema = new Schema({
  appointment_date: { type: String },
  time: { type: String },
  reason: { type: String },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  prescription: prescriptionSchema,
  medicines: [medicineSchema],
  token_number: { type: Number },
  follow_up_from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  temp: { type: String },
  Bp: { type: String }
});
const diagnoseReportSchema = new Schema({
  report_name: { type: String },
  diagnose_report:{ type: String }
});

// Patient schema
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
  diagnose_reports: [diagnoseReportSchema],

}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
