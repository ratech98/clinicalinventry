const { default: mongoose } = require("mongoose");
const Template = require("../modal/prescriptiontemplate");
const { Storage } = require("@google-cloud/storage");
const PDFDocument = require('pdfkit');

require("dotenv").config();
const bucketName = process.env.bucketName;
const gcsStorage = new Storage();

const getTemplatesByClinicId = async (req, res) => {
    const clinicId = req.params.clinicId;

    try {
        const templates = await Template.find({ clinic_id: clinicId });

        if (!templates || templates.length === 0) {
            return res.status(404).json({ success: false, message: 'No templates found for this clinic ID' });
        }

        res.json({ success: true, message: "Prescription template fetched successfully", templates });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
const getTemplatesByClinicIdAndSection = async (req, res) => {
  const clinicId = req.user._id;
  const section = "prescriptionDetails";

  try {
    const templates = await Template.find({
      clinic_id: clinicId,
      'dynamicFields.section': section
    });

    if (!templates || templates.length === 0) {
      return res.status(404).json({ success: false, message: `No templates found for this clinic ID with section ${section}` });
    }

    const filteredTemplates = templates.map(template => {
      const matchingFields = template.dynamicFields.filter(field => field.section === section);
      return {
        ...template.toObject(),  
        dynamicFields: matchingFields 
      };
    });

    res.json({ success: true, message: "Prescription template fetched successfully", templates: filteredTemplates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const add_field_to_template = async (req, res) => {
    const { clinicId, fieldName, section } = req.body;

    try {
        const template = await Template.findOne({ clinic_id: clinicId });

        if (template) {
            const fieldExists = template.dynamicFields.some(field => {
                const regex = new RegExp(`^${fieldName}$`, 'i');
                return regex.test(field.name);
            });

            if (fieldExists) {
                return res.status(400).json({ success: false, error: 'Field name already exists in the template' });
            }

            const newField = {
                section: section,
                name: fieldName,
                value: '',
                styles: {}
            };

            template.dynamicFields.push(newField);
            await template.save();

            res.status(200).json({ success: true, message: 'Field added successfully', template });
        } else {
            res.status(404).json({ success: false, error: 'Template not found for the specified clinic' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const update_field_in_template = async (req, res) => {
  const { clinicId, dynamicFields } = req.body; // Expecting dynamicFields to be an array of objects with section, fieldName, fieldValue, and fieldStyles

  try {
      let template = await Template.findOne({ clinic_id: clinicId });

      if (!template) {
          template = new Template({
              clinic_id: clinicId,
              dynamicFields: []
          });
      }

      dynamicFields.forEach(({ section, name, value, styles }) => {
          const fieldIndex = template.dynamicFields.findIndex(field => field.section === section && field.name === name);

          if (fieldIndex === -1) {
              const newField = {
                  section: section,
                  name: name,
                  value: value,
                  styles: styles
              };
              template.dynamicFields.push(newField);
          } else {
              template.dynamicFields[fieldIndex].value = value;
              template.dynamicFields[fieldIndex].styles = styles;
          }
      });

      await template.save();

      res.status(200).json({ success: true, message: 'Fields updated successfully', template });
  } catch (error) {
      console.error('Error updating fields:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


const delete_field_from_template = async (req, res) => {
    const { clinicId, section, fieldName } = req.params;

    try {
        const template = await Template.findOne({ clinic_id: clinicId });

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found for the specified clinic' });
        }

        const fieldIndex = template.dynamicFields.findIndex(field => field.section === section && field.name === fieldName);

        if (fieldIndex === -1) {
            return res.status(404).json({ success: false, error: 'Field not found in the template' });
        }

        template.dynamicFields.splice(fieldIndex, 1);
        await template.save();

        res.status(200).json({ success: true, message: 'Field deleted successfully', template });
    } catch (error) {
        console.error('Error deleting field:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const update_logo = async (req, res) => {
  try {
    const originalFilename = req.file.originalname;
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.]/g, '_');
    const imagePath = `clinic_logo/${Date.now()}_${sanitizedFilename}`;

    let template = await Template.findOne({ clinic_id: req.body.clinicId });

    if (template) {
      if (template.logo) {
        const oldLogoPath = template.logo.replace(`https://storage.googleapis.com/${bucketName}/`, '');
        await gcsStorage.bucket(bucketName).file(oldLogoPath).delete();
      }

      await gcsStorage.bucket(bucketName).file(imagePath).save(req.file.buffer);

      const logoUrl = `https://storage.googleapis.com/${bucketName}/${imagePath}`;

      template.logo = logoUrl;
      await template.save();
    } else {
      const logoUrl = `https://storage.googleapis.com/${bucketName}/${imagePath}`;
      await gcsStorage.bucket(bucketName).file(imagePath).save(req.file.buffer);

      template = new Template({
        clinic_id: req.body.clinicId,
        logo: logoUrl,
        dynamicFields: []
      });

      await template.save();
    }

    res.status(200).json({ success: true, message: "Logo added successfully", template });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const generatePDF = (details) => {
    const doc = new PDFDocument({ size: 'A4' });
    
    doc.fontSize(12).text(`Title: ${details.title}`, {
      align: 'center',
    });
  
    doc.fontSize(10).text(`Description: ${details.description}`, {
      align: 'left',
    });
  
    
    return doc;
  };
  
  const sendPDFResponse = (req, res) => {
    try {
      const details = req.body; 
      
      const doc = generatePDF(details);
      
      res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      
      doc.pipe(res);
      
      doc.end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

module.exports = {
    getTemplatesByClinicId,
    add_field_to_template,
    update_field_in_template,
    delete_field_from_template,
    update_logo,
    sendPDFResponse,
    getTemplatesByClinicIdAndSection
};
