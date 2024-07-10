const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const Receptionist = require('../modal/receptionist'); // Adjust path if needed
const Patient = require('../modal/patient'); // Adjust path if needed
const Medicine = require('../modal/medicine'); // Adjust path if needed

const clinicSchema = new mongoose.Schema({
  clinic_name: { type: String}, 
  name: { type: String },
  email: { type: String, },
  mobile_number: { type: String,},
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
  unblock_reason: { type: String, default: null }
}, { timestamps: true });

// Function to ensure indexes for the collections
async function ensureIndexes(db) {
  try {
    await db.collection('patients').createIndex({ name: 1 }, { unique: true });
    await db.collection('medicines').createIndex({ name: 1 }, { unique: true });
    await db.collection('dosageforms').createIndex({ form: 1 }, { unique: true });
    await db.collection('dosageunits').createIndex({ unit: 1 }, { unique: true });
    console.log('Indexes ensured');
  } catch (error) {
    console.error('Error ensuring indexes:', error);
    throw error;
  }
}

// Middleware to handle creation of DB and collections when adminVerified changes to true
clinicSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();
    console.log('Pre-update hook triggered with update:', update);

    // Only perform the hook logic if adminVerified is being updated to true
    if (update.adminVerified === true) {
      const docToUpdate = await this.model.findOne(this.getQuery());
      console.log('Document to update:', docToUpdate);

      if (!docToUpdate.dbUri && docToUpdate.clinic_name) {
        const dbName = `${docToUpdate.clinic_name.toLowerCase().replace(/\s/g, '_')}_db`;
        console.log('Generated dbName:', dbName);

        const uri = `mongodb+srv://testuser1:saravana03@cluster0.mqxbump.mongodb.net/${dbName}?retryWrites=true&w=majority`;

        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log('Connected to MongoDB Atlas cluster');

        // Create collections and ensure indexes if they don't exist
        const db = client.db(dbName);
        await Promise.all([
          db.createCollection('patients'),
          db.createCollection('medicines'),
          db.createCollection('dosageforms'),
          db.createCollection("dosageunits")
        ]);

        await ensureIndexes(db);

        await client.close();
        console.log('Disconnected from MongoDB Atlas cluster');

        update.dbUri = uri;
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

const Clinic = mongoose.model('Clinic', clinicSchema);

module.exports = Clinic;
