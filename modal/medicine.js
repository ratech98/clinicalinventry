const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const medicineSchema = new Schema({
  medicine_name: {
    type: String,
    required: true,
    unique: true,
  },
  dosage_form: [{
    type: String,
    enum:["liquid","tablet"]
  }],
  dosage_strength:{
    type:String
   },
   status:{
    type:String,
    enum:["Available","OutofStock"]
   }
 
 
},{timestamps:true}
);

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
