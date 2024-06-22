const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const docterSchema = new Schema({
  name: {
    type: String,
    required: false,
    
  },
  availablity: {
    type: String,
    enum:["available","onleave"],
    default:"available"
  },
  specilaist:{
    type: String,
   },
   mobile_number:{
    type:Number
   },
   address:{
    type:String
   },
   verify:{
    type:Boolean,
    default:false
},
clinic:[{
    type: mongoose.Schema.Types.ObjectId, ref: 'Clinic'
}],

profile:{
    type:String
},
gender:{
  type:String
},
age:{
  type:String
},
dob:{
  type:String
},
availability: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Availability'
}],
otp: { type: String, required: false },
undergraduate_certificate:{type:String},
postgraduate_certificate:{type:String}

 

 
},{timestamps:true});

const doctor = mongoose.model('doctor', docterSchema);

module.exports = doctor
