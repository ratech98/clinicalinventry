const { signInToken } = require("../config/auth");
const { errormesaages } = require("../errormessages");
const { createNotification } = require("../lib/notification");
const Availability = require("../modal/availablity");
const { ReceptionistAvailability } = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const doctor = require("../modal/doctor");
const Patient = require("../modal/patient");
const Receptionist = require("../modal/receptionist");
const { Storage } = require("@google-cloud/storage");
const moment =require('moment')

require("dotenv").config();
const bucketName = process.env.bucketName;
const gcsStorage = new Storage();

const addReceptionist = async (req, res) => {
  try {
    const receptionist = await Receptionist.create(req.body);
    res.status(200).json({ success: true, message: "Receptionist added successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllReceptionists = async (req, res) => {
  try {
    const receptionists = await Receptionist.find().populate('clinic');
    res.json({ success: true, message: "Receptionists fetched successfully", receptionists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getReceptionists = async (req, res) => {
  try {
    const receptionists = await Receptionist.find({ clinic: req.body.clinic }).populate('clinic');
    res.json({ success: true, message: "Receptionists fetched successfully", receptionists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getClinicDetailsByreceptionistId = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.body.id).populate('clinic');
    if (!receptionist) {
      return res.status(404).json({success:false,message: errormesaages[1004], errorcode: 1004 });
    }

    const clinic = receptionist.clinic;
    res.status(200).json({ success: true, message: 'Clinic details fetched successfully', clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getReceptionistById = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.params.id).populate('clinic');
    if (!receptionist) {
      return res.status(404).json({success:false,error: errormesaages[1004], errorcode: 1004 });
    }
    res.json({ success: true, message: "Receptionist fetched successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateReceptionist = async (req, res) => {

  try {
    const files = req.files;
    const uploadedFiles = {};
    for (const fieldName in files) {
      if (Object.hasOwnProperty.call(files, fieldName)) {
        const file = files[fieldName][0]; 
        const sanitizedFilename = file.originalname.replace(/\s+/g, '_');
        const imagePath = `docter_certificates/${Date.now()}_${sanitizedFilename}`;
        await gcsStorage.bucket(bucketName).file(imagePath).save(file.buffer);
        uploadedFiles[
          fieldName
        ] = `https://storage.googleapis.com/${bucketName}/${imagePath}`;
      }
    }
    req.body.details=true
    const updateData = { ...req.body, ...uploadedFiles };
    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id,updateData, { new: true });
    if (!receptionist) {
      return res.status(400).json({success:false, error: errormesaages[1004], errorcode: 1004 });
    }
    res.status(200).json({ success: true, message: "Receptionist updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteReceptionist = async (req, res) => {
  try {
    const receptionist = await Receptionist.findByIdAndDelete(req.params.id);
    if (!receptionist) {
      return res.status(400).json({success:false, error: errormesaages[1004], errorcode: 1004 });
    }
    res.json({ success: true, message: "Receptionist deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateReceptionistStatus = async (req, res) => {
  try {
    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id, { availability: req.body.availability }, { new: true });
    if (!receptionist) {
      return res.status(400).json({ success:false,error: errormesaages[1004], errorcode: 1004 });
    }
    res.status(200).json({ success: true, message: "Receptionist status updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateReceptionistVerify = async (req, res) => {
  try {
    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id, { verify: req.body.verify }, { new: true });
    if (!receptionist) {
      return res.status(400).json({success:false, error: errormesaages[1004], errorcode: 1004 });
    }
    
    if (receptionist.details!==true) {
      return res.status(404).json({success:false, error:  errormesaages[1011], errorcode: 1011});
    }
    if (receptionist.certificate_verify!==true) {
      return res.status(404).json({success:false, error:  errormesaages[1012], errorcode: 1012});
    }
    const clinic =await Clinic.findById(receptionist.clinic)
    createNotification("receptionist",req.params.id,`you are  ${req.body.verify?"verified":"not verified"} by clinic ${clinic.clinic_name} `,receptionist.clinic)

    res.status(200).json({ success: true, message: "Receptionist status updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const sendReceptionistOtpForLogin = async (req, res) => {
  const { mobile_number } = req.body;
  const otp = "1234";

  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: errormesaages[1008], errorcode: 1008 });
    }


    const receptionist = await Receptionist.findOneAndUpdate(
      { mobile_number },
      { mobile_number, otp},
    );

    if (!receptionist) {
      return res.status(404).json({ success: false, message: errormesaages[1004], errorcode: 1004 });
    }


    if (receptionist.block) {
      return res.status(400).json({ success: false, message:errormesaages[1047],errorcode:1047 });
    }

    await receptionist.save();

    // Code to send OTP via SMS
    // sendOtpSms(mobile_number, otp); // Uncomment and implement this function

    res.status(200).json({ success: true, message: 'OTP sent successfully and clinic set', receptionist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const sendReceptionistOtp = async (req, res) => {
  const { mobile_number, clinicId } = req.body;
  const otp = "1234";

  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false,message: errormesaages[1008], errorcode: 1008 });
    }
    const existingReceptionist = await Receptionist.findOne({ mobile_number, clinic: clinicId });
    if (existingReceptionist) {
      return res.status(400).json({ success: false, message: errormesaages[1018], errorcode: 1018 });
    }
    

    const receptionist = await Receptionist.findOneAndUpdate(
      { mobile_number },
      { mobile_number, otp, clinic: clinicId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    

    await receptionist.save();

    // Code to send OTP via SMS
    // sendOtpSms(mobile_number, otp); // Uncomment and implement this function

    res.status(200).json({ success: true, message: 'OTP sent successfully ', receptionist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyReceptionistOtp = async (req, res) => {
  const { mobile_number, otp } = req.body;

  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: errormesaages[1008], errorcode: 1008  });
    }
    if(!otp||otp===""){
      return res.status(400).json({ success: false,message: errormesaages[1015], errorcode: 1015 });

    }
    const receptionist = await Receptionist.findOne({ mobile_number });

    if (!receptionist) {
      return res.status(404).json({ success: false,message: errormesaages[1004], errorcode: 1004 });
    }
    if (receptionist.block) {
      return res.status(400).json({ success: false, message:errormesaages[1047],errorcode:1047 });
    }
    if (otp !== receptionist.otp) {
      return res.status(400).json({message: errormesaages[1016], errorcode: 1016  });
    }

    receptionist.otpVerified = true;
    await receptionist.save()
const token=signInToken(receptionist)
    res.status(200).json({ success: true, message: 'OTP verified successfully', receptionist,token,type:"Receptionist" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReceptionistsByClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { recently_joined, onleave, page = 1, limit = 10 ,verify} = req.query;

    let receptionistQuery = { clinic: id };

    if (recently_joined === 'true') {
      receptionistQuery.verify = false;
    }

    if (onleave === 'true') {
      receptionistQuery.availability = 'onleave'; 
    }
    if (verify) {
      receptionistQuery.verify = true; 
    }

    const totalReceptionists = await Receptionist.countDocuments(receptionistQuery);
    const totalPages = Math.ceil(totalReceptionists / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const receptionists = await Receptionist.find(receptionistQuery)
      .limit(limit)
      .skip(startIndex)
      .populate('clinic');

    if (!receptionists.length) {
      return res.status(404).json({success:true,message: errormesaages[1017], errorcode: 1017});
    }

    res.status(200).json({
      success: true,
      message: 'Fetched receptionists successfully',
      receptionists,
      totalCount: totalReceptionists,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      startIndex: startIndex + 1,
      endIndex: endIndex > totalReceptionists ? totalReceptionists : endIndex,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching receptionists:', error);
    res.status(500).json({ message: 'Error fetching receptionists', error });
  }
};


const blockOrUnblockReceptionist = async (req, res) => {
  const { id } = req.params;
  const { block, reason } = req.body;

  try {
    let receptionist;
    if (block) {
      receptionist = await Receptionist.findByIdAndUpdate(id, { block: true, block_reason: reason }, { new: true });
    } else {
      receptionist = await Receptionist.findByIdAndUpdate(id, { block: false, unblock_reason: reason }, { new: true });
    }

    if (!receptionist) {
      return res.status(404).json({  success: false,message: errormesaages[1004], errorcode: 1004 });
    }

    const action = block ? 'blocked' : 'unblocked';

    const clinic =await Clinic.findById(receptionist.clinic)
    createNotification("receptionist",id,`you are  ${action} by clinic ${clinic.clinic_name} for ${reason} `,receptionist.clinic)

    res.json({ success: true, message: `Receptionist ${action} successfully`, receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const verify_receptionist_certificate=async (req, res) => {
  const updateFields = {};

  if (req.body.certificate_verify !== undefined) {
    updateFields.certificate_verify = req.body.certificate_verify;
  }

  try {
    const receptionist = await Receptionist.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!receptionist) {
      return res.status(404).json({success: false,message: errormesaages[1004], errorcode: 1004 });
    }

    const clinic =await Clinic.findById(receptionist.clinic)

    createNotification("receptionist",req.params.id,`you are certificate ${req.body.certificate_verify?"verified":"not verifed"} by clinic ${clinic.clinic_name}  `,receptionist.clinic)

    res.status(200).json({success:true, message: 'Certificate verified', receptionist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const getDoctorsAndAvailabilityByClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialist, page = 1, limit = 10 } = req.query;

    const todayUTC = moment().format('DD-MM-YYYY');    
    const todayDay = new Date(todayUTC).getDay(); // Get the day of the week (0-6)

    const doctorQuery = { 'clinics.clinicId': id };
    if (specialist) {
      doctorQuery.specialist = { $regex: specialist, $options: 'i' };
    }

    const totalDoctors = await doctor.countDocuments(doctorQuery);
    const totalPages = Math.ceil(totalDoctors / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const doctors = await doctor.find(doctorQuery).select('specialist name mobile_number')
      .limit(limit)
      .skip(startIndex);

    if (!doctors.length) {
      return res.status(404).json({ success: false, error: 'No doctors found', errorcode: 1027 });
    }

    const doctorAvailabilityPromises = doctors.map(async (doctor) => {
      const availabilityDoc = await Availability.findOne({
        doctorId: doctor._id,
        clinicId: id
      });

      let availabilityStatus = 'unavailable';
      if (availabilityDoc) {
        const todayAvailability = availabilityDoc.availabilities.find(avail => avail.day === todayDay);
        if (todayAvailability) {
          const availableSlots = todayAvailability.slots.some(slot => slot.available);
          availabilityStatus = availableSlots ? 'available' : 'unavailable';
        }
      }

      const { tenantDBConnection } = req;
      if (!tenantDBConnection) {
        return res.status(500).json({ success: false, error: 'Tenant DB connection is not set' });
      }

      const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

      const todayAppointments = await PatientModel.find({
        'appointment_history': {
          $elemMatch: {
            doctor: doctor._id,
            // appointment_date: todayUTC
          }
        }
      });
      const tokenCount = todayAppointments.reduce((count, appointment) => {
        console.log("appoinment",appointment.appointment_history,todayUTC)

        const todayAppointment = appointment.appointment_history.find(app => 
          app.appointment_date === todayUTC
        );
        return todayAppointment ? count + 1 : count;
      }, 0);

      return {
        doctor,
        availability: availabilityStatus,
        tokenCount
      };
    });

    const doctorAvailability = await Promise.all(doctorAvailabilityPromises);

    res.status(200).json({
      success: true,
      message: 'Doctors fetched successfully',
      totalDoctorsCount: totalDoctors,
      totalCount: totalDoctors,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      startIndex: startIndex + 1,
      endIndex: endIndex > totalDoctors ? totalDoctors : endIndex,
      currentPage: parseInt(page),
      doctorAvailability: doctorAvailability,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};









module.exports = {
  addReceptionist,
  getAllReceptionists,
  getReceptionistById,
  updateReceptionist,
  deleteReceptionist,
  updateReceptionistStatus,
  updateReceptionistVerify,
  getReceptionists,
  getClinicDetailsByreceptionistId,
  sendReceptionistOtp,
  verifyReceptionistOtp,
  getReceptionistsByClinic,
  blockOrUnblockReceptionist,
  sendReceptionistOtpForLogin,
  verify_receptionist_certificate,
  getDoctorsAndAvailabilityByClinic
};
