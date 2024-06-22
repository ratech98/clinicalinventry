const { errormesaages } = require("../errormessages");
const { Availability } = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const doctor = require("../modal/doctor");
const { Storage } = require("@google-cloud/storage");

require("dotenv").config();
const bucketName = process.env.bucketName;
const gcsStorage = new Storage();


// const bucketName = process.env.BUCKET_NAME;
// const gcsStorage = new Storage();

const addClinic = async (req, res) => {
  try {
    const clinic = await Clinic.create(req.body);
    console.log(req.body);
    res.status(201).json({ success: true, message: "Clinic added successfully", clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find();
    res.json({ success: true, message: "Clinics fetched successfully", clinics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const getClinicById = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error:errormesaages[1001],errorcode:1001 });
    }
    res.json({ success: true, message: "Clinic fetched successfully", clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateClinic = async (req, res) => {
  try {

    const originalFilename = req.file.originalname;
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.]/g, '_');
    const imagePath = `clinic_certificates/${Date.now()}_${sanitizedFilename}`;
    await gcsStorage.bucket(bucketName).file(imagePath).save(req.file.buffer);

    const clinic = await Clinic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!clinic) {
      return res.status(400).json({ error:errormesaages[1001],errorcode:1001  });
    }
    res.status(200).json({ success: true, message: "Clinic updated successfully", clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteClinic = async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndDelete(req.params.id);
    if (!clinic) {
      return res.status(400).json({ error:errormesaages[1001],errorcode:1001  });
    }
    res.json({ success: true, message: "Clinic deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const verify_clinic=async (req, res) => {
  try {
    const clinic = await Clinic.findOneAndUpdate(
      { _id: req.params.id },
      { adminVerified: true },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Admin verified successfully', clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const getDoctorsAndAvailabilityByClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { specilaist } = req.query; 
    const today = new Date().toISOString().split('T')[0]; 

    const doctorQuery = { clinic: id };
    if (specilaist) {
      doctorQuery.specilaist = specilaist;
    }
    console.log(doctorQuery,specilaist)
    const doctors = await doctor.find(doctorQuery).populate('availability');

    if (!doctors.length) {
      return res.status(404).json({ message: 'No doctors found for this clinic' });
    }

    const doctorAvailabilityPromises = doctors.map(async (doctor) => {
      const availability = await Availability.findOne({
        doctor: doctor._id,
        clinic: id,
        date: today
      });
      return {
        doctor: doctor.name,
        specialist: doctor.specilaist,
        status:true
      };
    });

    const doctorAvailability = await Promise.all(doctorAvailabilityPromises);

    res.status(200).json(doctorAvailability);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server error', error });
  }
};
module.exports = { addClinic,
                   getAllClinics, 
                   getClinicById, 
                   updateClinic, 
                   deleteClinic ,
                   verify_clinic,
                   getDoctorsAndAvailabilityByClinic
                  };
