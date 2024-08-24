const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    type:Boolean,
  
  },
  follow_up_date:{type:String},
  temp: { type: String },
  Bp: { type: String },
  status:{type:String,
    enum: ['FINISHED', 'PENDING'],
    default:"PENDING"
}
});
const diagnoseReportSchema = new Schema({
  report_name: { type: String },
  diagnose_report:{ type: String }
},{ timestamps: true });

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
  bond:{type:String, default:"myself"},
  email: {
    type: String,

  },

}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
