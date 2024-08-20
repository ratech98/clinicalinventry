const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const moment = require('moment');

const Template = require('./prescriptiontemplate');
const smsTemplateSchema = require('./smstemplate').SMSTemplate.schema;
const smsTypeSchema = require('./smstemplate').SMSType.schema;

const subscriptionDetailSchema = new mongoose.Schema({
  subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionDuration' },
  transaction_id: { type: String },
  subscription_startdate: { type: String },
  subscription_enddate: { type: String },
}, { _id: false });

const clinicSchema = new mongoose.Schema({
  clinic_name: { type: String },
  name: { type: String },
  email: { type: String },
  mobile_number: { type: String },
  agree: { type: Boolean, required: false },
  certificate: { type: String, required: false },
  certificate2: { type: String, required: false },
  certificate3: { type: String, required: false },
  otp: { type: String, required: false },
  otpVerified: { type: Boolean, default: false },
  adminVerified: { type: Boolean, default: false },
  certificateVerified: { type: Boolean, default: false },
  certificate2Verified: { type: Boolean, default: false },
  certificate3Verified: { type: Boolean, default: false },
  dbUri: { type: String },
  block: { type: Boolean, default: false },
  block_reason: { type: String, default: null },
  unblock_reason: { type: String, default: null },
  subscription: { type: Boolean, default: false },
  subscription_details: [subscriptionDetailSchema],
  profile: { type: String },
  details: { type: Boolean, default: false },
  type:{type:String,default:"clinic"}

}, { timestamps: true });

async function ensureIndexes(db) {
  try {
    await db.collection('patients')
    await db.collection('medicines')
    await db.collection('dosageforms')
    await db.collection('dosageunits')
    await db.createCollection('smstypes');
    await db.createCollection('smstemplates');

    console.log('Indexes ensured');
  } catch (error) {
    console.error('Error ensuring indexes:', error);
    throw error;
  }
}

function getTenantModel(connection, modelName, schema) {
  if (connection.models[modelName]) {
    return connection.models[modelName];
  }
  return connection.model(modelName, schema);
}

clinicSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();
    console.log('Pre-update hook triggered with update:', update);

    if (update.adminVerified === true) {
      const docToUpdate = await this.model.findOne(this.getQuery());
      console.log('Document to update:', docToUpdate);

      if (!docToUpdate.dbUri && docToUpdate.clinic_name) {
        const currentdate = moment().format('DD-MM-YYYY');
        const dbName = `Di_${docToUpdate.clinic_name.toLowerCase().replace(/\s/g, '_')}_db${currentdate}`;
        console.log('Generated dbName:', dbName);

        const uri = `mongodb+srv://testuser1:saravana03@cluster0.mqxbump.mongodb.net/${dbName}?retryWrites=true&w=majority`;

        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log('Connected to MongoDB Atlas cluster');

        const db = client.db(dbName);
        await ensureIndexes(db);

        await client.close();
        console.log('Disconnected from MongoDB Atlas cluster');

        update.dbUri = uri;

        const tenantClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await tenantClient.connect();
        console.log('Connected to tenant MongoDB Atlas cluster');

        const tenantConnection = mongoose.createConnection(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        const SMSType = getTenantModel(tenantConnection, 'SMSType', smsTypeSchema);
        const SMSTemplate = getTenantModel(tenantConnection, 'SMSTemplate', smsTemplateSchema);

        const smsTypes = ['SEND_OTP', 'Create_Account', 'Patients_Appoinment'];
        const smsTypeIds = {};

        for (const type of smsTypes) {
          let smsType = await SMSType.findOne({ name: type }).exec();
          if (!smsType) {
            smsType = new SMSType({ name: type });
            await smsType.save();
            console.log(`SMS type '${type}' created`);
          }
          smsTypeIds[type] = smsType._id;
        }

        const smsTemplates = [
          {
            smstypeId: smsTypeIds['SEND_OTP'],
            body: 'Your OTP code is {{otpCode}}. Please use this code to complete your verification.'
          },
          {
            smstypeId: smsTypeIds['Create_Account'],
            body: 'Your account has been created successfully. Welcome!'
          },
          {
            smstypeId: smsTypeIds['Patients_Appoinment'],
            body: 'Your appointment is confirmed for {{appointmentDate}}. See you soon!'
          }
        ];

        for (const template of smsTemplates) {
          const existingTemplate = await SMSTemplate.findOne({ smstypeId: template.smstypeId }).exec();
          if (!existingTemplate) {
            const newTemplate = new SMSTemplate(template);
            await newTemplate.save();
            console.log(`SMS template created for type ID '${template.smstypeId}'`);
          }
        }

        await tenantClient.close();
        console.log('Disconnected from tenant MongoDB Atlas cluster');
      } else {
        console.error('clinic_name is undefined or dbUri already exists');
      }
    }

    next();
  } catch (error) {
    console.error('Error in pre-update hook:', error);
    next(error);
  }
});

clinicSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      const clinicId = this._id;
      const defaultFields = [
        { name: "Clinic Name", section: "clinicDetails", value: "" },
        { name: "Contact number", section: "clinicDetails", value: "" },
        { name: "Address", section: "clinicDetails", value: "" },
        { name: "GST No", section: "clinicDetails" },
        { name: "Doctor Name", section: "doctorDetails", value: "" },
        { name: "Speciality", section: "doctorDetails", value: "" },
        { name: "Degree", section: "doctorDetails", value: "" },
        { name: "Work", section: "doctorDetails", value: "" }
      ];

      const template = new Template({
        clinic_id: clinicId,
        dynamicFields: defaultFields
      });

      await template.save();
      console.log('Default template fields created');
    }

    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});

const Clinic = mongoose.model('Clinic', clinicSchema);

module.exports = Clinic;
