const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
}, { timestamps: true });

const Availability = mongoose.model('Availability', availabilitySchema);

const receptionistAvailabilitySchema = new Schema({
    receptionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receptionist',
      required: true
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }, { timestamps: true });
  
  const ReceptionistAvailability = mongoose.model('ReceptionistAvailability', receptionistAvailabilitySchema);
  

module.exports = {Availability,ReceptionistAvailability}
