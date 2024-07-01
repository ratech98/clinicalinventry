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
            return res.status(404).json({ message: 'No templates found for this clinic ID' });
        }

        res.json({success:true,message:"prescription template fetched successfully",templates});
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
const createTemplate = async (req, res) => {
    const { clinic_id } = req.body;

    try {
        const existingTemplate = await Template.findOne({ clinic_id });

        if (existingTemplate) {
            return res.status(400).json({ success: false, message: 'Prescription template with this clinic ID already exists' });
        }

        const newTemplate = await Template.create(req.body);

        res.status(201).json({ success: true, message: 'Prescription template created successfully', template: newTemplate });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to create prescription template', error: err.message });
    }
};


const updateTemplate = async (req, res) => {
    const templateId = req.params.templateId; 
    const updateFields = req.body;

    try {
        const updatedTemplate = await Template.findByIdAndUpdate(templateId, updateFields, { new: true });

        if (!updatedTemplate) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        res.json({ success: true, message: 'Prescription template updated successfully', template: updatedTemplate });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to update prescription template', error: err.message });
    }
};





module.exports={
                 getTemplatesByClinicId,
                 createTemplate,
                 updateTemplate
}