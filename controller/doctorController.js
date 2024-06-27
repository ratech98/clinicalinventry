
const { errormesaages } = require("../errormessages");
const { Availability, timeSlotsSchema } = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const doctor = require("../modal/doctor");
const { Storage } = require("@google-cloud/storage");
const gcsStorage = new Storage();
const bucketName = process.env.bucketName;
require("dotenv").config();


require("dotenv").config();

const addDoctor = async (req, res) => {
  try {
    const doctors = await doctor.create(req.body);
    res.status(201).json({ success: true, message: "Doctor added successfully", doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await doctor.find().populate('clinics.clinicId');
    res.json({ success: true, message: "Doctors fetched successfully", doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getClinicDetailsByDoctorId = async (req, res) => {
  try {
    const doctors = await doctor.findById(req.body.doctorId).populate('clinics.clinicId');
    if (!doctors) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const clinics = doctors.clinics;
    res.status(200).json({ success: true, message: 'Clinic details fetched successfully', clinics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const getDoctorById = async (req, res) => {
  try {
    const doctors = await doctor.findById(req.params.id).populate('clinics.clinicId');
    if (!doctors) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json({ success: true, message: "Doctor fetched successfully", doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const updateDoctor = async (req, res) => {
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
    const updateData = { ...req.body, ...uploadedFiles };

    const doctors = await doctor.findByIdAndUpdate(req.params.id, updateData, { new: true })
    if (!doctors) {
      return res.status(400).json({ error: errormesaages[1002], errorcode: 1002 });
    }
    res.status(200).json({ success: true, message: "Doctor updated successfully", doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateDoctorAvailability = async (req, res) => {
  try {
    const doctors = await doctor.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('clinic');
    if (!doctors) {
      return res.status(400).json({ error: errormesaages[1002], errorcode: 1002 });
    }
    res.status(200).json({ success: true, message: "Doctor updated successfully", doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const verifyDoctorClinic = async (req, res) => {
  const { doctorId, clinicId,verify } = req.body;

  try {
    const doctors = await doctor.findById(doctorId);

    if (!doctors) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const clinic = doctors.clinics.find(c => c.clinicId.toString() === clinicId);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found for this doctor' });
    }

    clinic.verified = verify;

    await doctors.save();

    res.status(200).json({ success: true, message: 'Clinic verified successfully', doctors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(400).json({ error:  errormesaages[1002], errorcode: 1002 });
    }
    res.json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addClinicToDoctor = async (req, res) => {
  const { doctorId, clinicId } = req.body;

  try {
    const doctors = await doctor.findById(doctorId);
    if (!doctors) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    doctors.clinic.push(clinic._id);
    await doctors.save();

    res.status(200).json({ success: true, message: 'Clinic added to doctor successfully', doctors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addDoctorAvailability = async (req, res) => {
  const { doctorId, clinicId, days, slots } = req.body;

  try {
    const doctors = await doctor.findById(doctorId);
    if (!doctors) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const existingAvailability = await Availability.findOne({
      doctor: doctorId,
      clinic: { $ne: clinicId }, // Exclude current clinic
      days: days,
      slots: slots.reduce((acc, slot) => {
        acc[slot] = true; // Convert array of slots to object format
        return acc;
      }, {})
    });

    if (existingAvailability) {
      return res.status(400).json({ error: 'Doctor already has availability with the same slots for another clinic' });
    }

    // Transform slots array into the required format
    const formattedSlots = {};
    slots.forEach(slot => {
      if (slot in timeSlotsSchema.obj) {
        formattedSlots[slot] = true; // Set selected slots to true
      }
    });

    // Create new availability document
    const availability = new Availability({
      doctor: doctorId,
      clinic: clinicId,
      days: days,
      slots: formattedSlots
    });

    // Save availability
    await availability.save();

    res.status(201).json({ success: true, message: 'Availability added successfully', availability });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}; 




const updateDoctorAvailabilitty = async (req, res) => {
  const { availabilityId, doctorId, clinicId, days, slots } = req.body;

  try {
    const availability = await Availability.findById(availabilityId);
    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    const formattedSlots = {};
    slots.forEach(slot => {
      if (slot in timeSlotsSchema.obj) {
        formattedSlots[slot] = true; // Set selected slots to true
      }
    });

    const overlappingAvailability = await Availability.find({
      _id: { $ne: availabilityId },
      doctor: doctorId,
      days: { $in: days }
    });

    for (const existingAvailability of overlappingAvailability) {
      for (const slot in formattedSlots) {
        if (existingAvailability.slots[slot]) {
          return res.status(400).json({ error: `Slot ${slot} on ${existingAvailability.days} overlaps with existing availability in another clinic` });
        }
      }
    }

    availability.doctor = doctorId;
    availability.clinic = clinicId;
    availability.days = days;
    availability.slots = { ...availability.slots, ...formattedSlots };

    await availability.save();

    res.status(200).json({ success: true, message: 'Availability updated successfully', availability });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const sendDoctorOtpForLogin = async (req, res) => {
  const { mobile_number } = req.body;
  const otp = "1234"; 

  try {
    const doctorData = await doctor.findOneAndUpdate(
      { mobile_number },
      { $set: { otp } },
    );


    if (!doctorData) {
      return res.status(404).json({ success: false, message: 'Receptionist not found' });
    }

    if (!doctorData.otpVerified) {
      return res.status(400).json({ success: false, message: 'Your mobile number is not verified' });
    }
    if(!doctorData.verify){
      return res.status(400).json({ success: false, message: 'you are not verified by admin,contact admin' });
    
    }

    if (doctorData.block) {
      return res.status(400).json({ success: false, message: 'You are blocked by admin, contact admin' });
    }

    await doctorData.save();

    // Code to send OTP via SMS
    // sendOtpSms(mobile_number, otp); // Uncomment and implement this function

    res.status(200).json({ success: true, message: 'OTP sent successfully', doctor: doctorData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};








const sendDoctorOtp = async (req, res) => {
  const { mobile_number, clinicId } = req.body;
  const otp = "1234"; // You can generate a random OTP here

  try {
    const doctorData = await doctor.findOneAndUpdate(
      { mobile_number },
      { $set: { otp } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const clinicExists = doctorData.clinics.some(c => c.clinicId.toString() === clinicId);
    if (!clinicExists) {
      doctorData.clinics.push({ clinicId, verified: false });
    }

    await doctorData.save();

    // Code to send OTP via SMS
    // sendOtpSms(mobile_number, otp); // Uncomment and implement this function

    res.status(200).json({ success: true, message: 'OTP sent successfully and clinic processed', doctor: doctorData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const verifyDoctorOtp = async (req, res) => {
  const { mobile_number, otp } = req.body;

  try {
    const doctorData = await doctor.findOne({ mobile_number });

    if (!doctorData) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (otp !== doctorData.otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    doctorData.otpVerified = true;

    await doctorData.save();

    res.status(200).json({ success: true, message: 'OTP verified successfully', doctor: doctorData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const blockOrUnblockDoctor = async (req, res) => {
  const { id } = req.params;
  const { block, reason } = req.body;

  try {
    let doctors;
    if (block) {
      doctors = await doctor.findByIdAndUpdate(id, { block: true, block_reason: reason }, { new: true });
    } else {
      doctors = await doctor.findByIdAndUpdate(id, { block: false, unblock_reason: reason }, { new: true });
    }

    if (!doctors) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const action = block ? 'blocked' : 'unblocked';
    res.json({ success: true, message: `Doctor ${action} successfully`, doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




module.exports = { 
                addDoctor, 
                getAllDoctors, 
                getDoctorById,
                 updateDoctor, 
                 deleteDoctor ,
                updateDoctorAvailability,
           
                addClinicToDoctor,
                addDoctorAvailability,
                updateDoctorAvailabilitty,
                getClinicDetailsByDoctorId,
                sendDoctorOtp,
                verifyDoctorOtp,
                verifyDoctorClinic,
               blockOrUnblockDoctor,
               sendDoctorOtpForLogin
                };
