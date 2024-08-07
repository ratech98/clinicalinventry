const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  recipientType: {
    type: String,
    enum: ['clinic', 'doctor', 'receptionist','admin'],
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType'
  },
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    // required: function() {
    //   return this.recipientType === 'doctor' || this.recipientType === 'receptionist';
    // }
  },
  content: {
    type: String,
    required: true
  },
 
  read: {
    type: Boolean,
    default: false
  }
},{timestamps:true});

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
