const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const timeSlotsSchema = new Schema({
  "6AM-7AM": { type: Boolean, default: false },
  "7AM-8AM": { type: Boolean, default: false },
  "8AM-9AM": { type: Boolean, default: false },
  "9AM-10AM": { type: Boolean, default: false },
  "10AM-11AM": { type: Boolean, default: false },
  "11AM-12PM": { type: Boolean, default: false },
  "12PM-1PM": { type: Boolean, default: false },
  "1PM-2PM": { type: Boolean, default: false },
  "2PM-3PM": { type: Boolean, default: false },
  "3PM-4PM": { type: Boolean, default: false },
  "4PM-5PM": { type: Boolean, default: false },
  "5PM-6PM": { type: Boolean, default: false },
  "6PM-7PM": { type: Boolean, default: false },
  "7PM-8PM": { type: Boolean, default: false },
  "8PM-9PM": { type: Boolean, default: false },
  "9PM-10PM": { type: Boolean, default: false },
  "10PM-11PM": { type: Boolean, default: false },
  "11PM-12AM": { type: Boolean, default: false }
}, { _id: false });

const availabilitySchema = new Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  days: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Everyday'],
    required: true
  },
  slots: timeSlotsSchema
}, { timestamps: true });

const Availability = mongoose.model('Availability', availabilitySchema);


module.exports = { Availability, timeSlotsSchema };
