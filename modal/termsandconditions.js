const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const terms_and_conditionsSchema = new Schema({
  content: {
    type: String,
    required: true,
   
  },
 

},{timestamps:true}
);

const terms_and_conditions = mongoose.model('terms_and_conditions', terms_and_conditionsSchema);


const aboutusSchema = new Schema({
    content: {
      type: String,
      required: true,
     
    },
   
  
  },{timestamps:true}
  );
  
  const about_us = mongoose.model('about_us', aboutusSchema);


const helpandsupportschema = new Schema({
    name: {
      type: String,
      required: true,
     
    },
    email:{
        type: String,
        required: true,
    },
    mobile_number:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    clinicId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true
    }
   
  
  },{timestamps:true}
  );
  
  const helpandsupport = mongoose.model('helpandsupport', helpandsupportschema);

module.exports = {terms_and_conditions,about_us,helpandsupport}
