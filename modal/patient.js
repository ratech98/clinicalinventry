const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const patientSchema = new Schema({
  name: {
    type: String,
    required: false,

  },
 mobile_number:{
    type:Number,
    
   },
   address:{
    type:String
   },
  
   appointment_history: [{
    appointment_date: { type: String },
    reason: { type: String },
    doctor:{
      type: mongoose.Schema.Types.ObjectId, ref: 'doctor'
     },

  }],
   gender:{
    type:String
  },
  age:{
    type:String
  },
  dob:{
    type:String
  },
  otp:{
    type:String
  },
  temp:{
    type:String
  },
  Bp:{
    type:String
  }
  

 
},{timestamps:true});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient
