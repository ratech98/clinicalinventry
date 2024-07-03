const { default: mongoose } = require("mongoose");
const Template = require("../modal/prescriptiontemplate");
const { Storage } = require("@google-cloud/storage");

require("dotenv").config();
const bucketName = process.env.bucketName;
const gcsStorage = new Storage();

const getTemplatesByClinicId = async (req, res) => {
    const clinicId = req.params.clinicId;

    try {
        const templates = await Template.find({ clinic_id: clinicId });

        if (!templates || templates.length === 0) {
            return res.status(404).json({success:false, message: 'No templates found for this clinic ID' });
        }

        res.json({success:true,message:"prescription template fetched successfully",templates});
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
const add_field_to_template = async (req, res) => {
    const { clinicId, fieldName } = req.body;
  
    try {
      const template = await Template.findOne({ clinic_id: clinicId });
      if (template) {
        const fieldExists = template.dynamicFields.some(field => {
          const regex = new RegExp(`^${fieldName}$`, 'i');
          return regex.test(field.name);
        });

        if (fieldExists) {
          return res.status(400).json({success:false, error: 'Field name already exists in the template' });
        } }
      if (template) {
        const newField = {
          _id: new mongoose.Types.ObjectId(),
          name: fieldName,
          value: '',
          styles: {}
        };
  
        template.dynamicFields.push(newField);
        await template.save();
  
        res.status(200).json({ success: true, message: 'Field added successfully',template});
      } else {
        res.status(404).json({success:false, error: 'Template not found for the specified clinic' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  const update_field_in_template = async (req, res) => {
    const { fieldId, fieldValue, fieldStyles } = req.body;
  
    console.log('Incoming request data:', req.body);
  
    try {
      const allTemplates = await Template.find({});
      console.log('All templates:', JSON.stringify(allTemplates, null, 2));
  
      const template = await Template.findOne({ 'dynamicFields._id': fieldId });
      console.log('Template before update:', template);
  
      if (!template) {
        return res.status(404).json({ success:false,error: 'Field not found' });
      }
  
      const updatedTemplate = await Template.findOneAndUpdate(
        { 'dynamicFields._id': fieldId },
        {
          $set: {
            'dynamicFields.$.value': fieldValue,
            'dynamicFields.$.styles': fieldStyles
          }
        },
        { new: true }
      );
  
      console.log('Template after update:', updatedTemplate);
  
      if (updatedTemplate) {
        res.status(200).json({
          success: true,
          message: 'Field updated successfully',
          templates: [updatedTemplate]
        });
      } else {
        res.status(404).json({success:false, error: 'Field not found' });
      }
    } catch (error) {
      console.error('Error updating field:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  const delete_field_from_template = async (req, res) => {
    const { clinicId, fieldId } = req.params; 
  
    try {
      const template = await Template.findOne({ clinic_id: clinicId });
  
      if (!template) {
        return res.status(404).json({success:false, error: 'Template not found for the specified clinic' });
      }
  
      const fieldIndex = template.dynamicFields.findIndex(field => field._id.toString() === fieldId);
  
      if (fieldIndex === -1) {
        return res.status(404).json({success:false, error: 'Field not found in the template' });
      }
  
      template.dynamicFields.pull({ _id:new mongoose.Types.ObjectId(fieldId) });
      await template.save();
  
      res.status(200).json({ success: true, message: 'Field deleted successfully', template });
    } catch (error) {
      console.error('Error deleting field:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

module.exports={
                 getTemplatesByClinicId,
                 add_field_to_template,
                 update_field_in_template,
                 delete_field_from_template
}