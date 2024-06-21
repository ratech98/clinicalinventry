const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const Receptionist = require('../modal/receptionist'); // Adjust path if needed
const Patient = require('../modal/patient'); // Adjust path if needed
const Medicine = require('../modal/medicine'); // Adjust path if needed

const clinicSchema = new mongoose.Schema({
  clinic_name: { type: String },
  name: { type: String },
  email: { type: String, unique: true },
  mobile_number: { type: String, unique: true },
  agree: { type: Boolean, required: false },
  certificate: { type: String, required: false },
  certificate2: { type: String, required: false },
  certificate3: { type: String, required: false },
  otp: { type: String, required: false },
  otpVerified: { type: Boolean, default: false },
  adminVerified: { type: Boolean, default: false },
  certificate1Verified: { type: Boolean, default: false },
  certificate2Verified: { type: Boolean, default: false },
  certificate3Verified: { type: Boolean, default: false },
  dbUri: { type: String }, 
  availability: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Availability'
  }]
}, { timestamps: true });

const ensureIndexes = async (db) => {
  await Promise.all([
    db.collection('receptionists').createIndex({ email: 1 }, { unique: true }),
    db.collection('patients').createIndex({ name: 1 }),
    db.collection('medicines').createIndex({ name: 1 }),
  ]);
};

// Middleware to handle creation of DB and collections when adminVerified changes to true
clinicSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();
    console.log('Pre-update hook triggered with update:', update);

    if (update.adminVerified === true) {
      const docToUpdate = await this.model.findOne(this.getQuery());
      console.log('Document to update:', docToUpdate);

      if (!docToUpdate.dbUri) {
        const dbName = `${docToUpdate.clinic_name.toLowerCase().replace(/\s/g, '_')}_db`;
        console.log('Generated dbName:', dbName);

        const uri = `mongodb+srv://testuser1:saravana03@cluster0.mqxbump.mongodb.net/${dbName}?retryWrites=true&w=majority`;

        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log('Connected to MongoDB Atlas cluster');

        // Create collections and ensure indexes if they don't exist
        const db = client.db(dbName);
        await Promise.all([
          // db.createCollection('receptionists'),
          db.createCollection('patients'),
          db.createCollection('medicines'),
        ]);

        await ensureIndexes(db);

        await client.close();
        console.log('Disconnected from MongoDB Atlas cluster');

        // Update the document with the new dbUri
        update.dbUri = uri;
      }
    }
    next();
  } catch (error) {
    console.error('Error in pre-update hook:', error);
    next(error);
  }
});

const Clinic = mongoose.model('Clinic', clinicSchema);

module.exports = Clinic;
