const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  timeSlot: { type: String, required: true },
  available: { type: Boolean, default: true }
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  availabilities: [{
    day: { type: String, required: true },
    slots: [slotSchema]
  }],
  unavailable: [{
    date: { type: Date, required: true },
   
  }]
}, { timestamps: true });

const Availability = mongoose.model('Availability', availabilitySchema);
module.exports = Availability;
