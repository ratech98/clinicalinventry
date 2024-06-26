const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const medicineSchema = new Schema({
  medicine_name: {
    type: String,
    required: true,
    unique: true,
  },
  dosage_form: [{
    type:  mongoose.Schema.Types.ObjectId,
    ref: 'DosageForm',
  }],
  dosage_strength:{
    type:String
   },
   dosage_unit:{
    type:  mongoose.Schema.Types.ObjectId,
    ref: 'DosageUnit',
   },
   status:{
    type:String,
    enum:["Available","OutofStock"]
   }
 
 
},{timestamps:true}
);



const Medicine = mongoose.model('Medicine', medicineSchema);





const dosageUnitSchema = new Schema({
  unit_name: {
    type: String,
    required: true,
    unique: true,
  }

}, { timestamps: true });

const DosageUnit = mongoose.model('DosageUnit', dosageUnitSchema);

const dosageFormSchema = new Schema({
  form_name: {
    type: String,
    required: true,
    unique: true,
  },
 
}, { timestamps: true });

const DosageForm = mongoose.model('DosageForm', dosageFormSchema);


module.exports ={ Medicine,DosageUnit,DosageForm}
