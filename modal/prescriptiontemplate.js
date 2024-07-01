const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const defaultStyles = {
    font: 'Arial',
    size: '12px',
    color: '#000000',
    align: 'left'
};

const fieldSchema = new Schema({
    name: { type: String, required: true },
    styles: {
        type: {
            font: { type: String, default: defaultStyles.font },
            size: { type: String, default: defaultStyles.size },
            color: { type: String, default: defaultStyles.color },
            align: { type: String, default: defaultStyles.align }
        },
        default: defaultStyles
    }
});

const TemplatedetailsSchema = new Schema({
    clinic_id: { type: Schema.Types.ObjectId }, 
    logo:{type:String},
    clinic_name: fieldSchema,
    clinic_address: fieldSchema,
    clinic_gst: fieldSchema,
    clinic_contact: fieldSchema,
    doctor_name: fieldSchema,
    doctor_specialist: fieldSchema,
    doctor_degree: fieldSchema,
    doctor_work: fieldSchema
});
const Template=mongoose.model('Template', TemplatedetailsSchema);
module.exports = Template
