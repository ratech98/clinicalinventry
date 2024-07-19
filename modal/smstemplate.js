
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const smsTypeSchema = new Schema({
  name: { type: String, required: true, unique: true }, 
}, { timestamps: true });

const SMSType = mongoose.model('SMSType', smsTypeSchema);


const smstemplateSchema = new mongoose.Schema({
    smstypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SMSType', required: true },
    body: { type: String, required: true },
  }, { timestamps: true });
  
  const SMSTemplate = mongoose.model('SMSTemplate', smstemplateSchema);
  

module.exports = {SMSTemplate,SMSType}
