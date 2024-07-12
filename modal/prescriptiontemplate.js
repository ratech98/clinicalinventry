const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const defaultStyles = {
  font: 'Sansserif',
  size: '12px',
  color: '#000000',
  align: 'left',
  font_weight: '400'
};

const fieldSchema = new Schema({
  section:{type:String,required:true},
  name: { type: String, required: true },
  value: { type: String, required: true },
  styles: {
    type: {
      font: { type: String, default: defaultStyles.font },
      size: { type: String, default: defaultStyles.size },
      color: { type: String, default: defaultStyles.color },
      align: { type: String, default: defaultStyles.align },
      font_weight: { type: String, default: defaultStyles.font_weight }
    },
    default: defaultStyles
  }
}, { _id: false });

const TemplatedetailsSchema = new Schema({
  clinic_id: { type: Schema.Types.ObjectId },
  logo: { type: String },
  dynamicFields: [fieldSchema]
});

const Template = mongoose.model('Template', TemplatedetailsSchema);
module.exports = Template;
