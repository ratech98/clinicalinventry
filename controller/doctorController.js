
const { errormesaages } = require("../errormessages");
const Availability = require("../modal/availablity");
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
    res.status(200).json({ success: true, message: "Doctor added successfully", doctors });
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
      return res.status(404).json({success:false,error: errormesaages[1002], errorcode: 1002 });
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
      return res.status(404).json({ success:false,error: errormesaages[1002], errorcode: 1002 });
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

  req.body.details=true
    const updateData = { ...req.body, ...uploadedFiles };

    const doctors = await doctor.findByIdAndUpdate(req.params.id, updateData, { new: true })
    if (!doctors) {
      return res.status(400).json({success:false, error: errormesaages[1002], errorcode: 1002 });
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
      return res.status(400).json({success:false, error: errormesaages[1002], errorcode: 1002 });
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
      return res.status(404).json({success:false, error:  errormesaages[1002], errorcode: 1002});
    }
    
    if (doctors.details!==true) {
      return res.status(404).json({success:false, error:  errormesaages[1010], errorcode: 1010});
    }
    if (doctors.postgraduate_certificate_verify!==true||doctors.undergraduate_certificate_verify!==true) {
      return res.status(404).json({success:false, error:  errormesaages[1012], errorcode: 1012});
    }
    const clinic = doctors.clinics.find(c => c.clinicId.toString() === clinicId);

    if (!clinic) {
      return res.status(404).json({success:false, error:errormesaages[1013], errorcode: 1013 });
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
    const doctors = await doctor.findByIdAndDelete(req.params.id);
    if (!doctors) {
      return res.status(400).json({success:false, error:  errormesaages[1002], errorcode: 1002 });
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
      return res.status(404).json({success:false, error: 'Doctor not found' });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({success:false, error: 'Clinic not found' });
    }

    doctors.clinic.push(clinic._id);
    await doctors.save();

    res.status(200).json({ success: true, message: 'Clinic added to doctor successfully', doctors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
function formatDate(date) {
  const year = date.getFullYear();
  let month = (1 + date.getMonth()).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const addDoctorAvailability = async (req, res) => {
  const { doctorId, clinicId, days, slots } = req.body;

  try {
    const doctors = await doctor.findById(doctorId);
    if (!doctors) {
      return res.status(404).json({ success: false, error: "Doctor not found" });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, error: "Clinic not found" });
    }

    const nextOccurrences = calculateNextOccurrences(days);

    const availabilities = nextOccurrences.map(date => ({
      date: formatDate(date), // Format date as YYYY-MM-DD
      day: getDayOfWeek(date),
      slots: slots.map(slot => ({ timeSlot: slot, available: true }))
    }));

    for (const availability of availabilities) {
      const existingAvailability = await Availability.findOne({
        doctorId,
        'availabilities.date': availability.date,
        'availabilities.slots.timeSlot': { $in: slots }
      });
      if (existingAvailability) {
        return res.status(400).json({ success: false, error: `Doctor already has availability on ${availability.date} for one of the provided slots` });
      }
    }

    // Create new availability document
    const newAvailability = new Availability({
      doctorId,
      clinicId,
      availabilities
    });

    // Save availability
    await newAvailability.save();

    res.status(201).json({ success: true, message: 'Availability added successfully', availability: newAvailability });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





function calculateNextOccurrences(days) {
  const today = new Date();
  const nextOccurrences = [];

  for (let day of days) {
    const date = getNextDayOfWeek(day, today);
    if (date > today) {
      nextOccurrences.push(date);
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let day of days) {
      const date = getNextDayOfWeek(day, today);
      date.setDate(date.getDate() + i * 7);
      nextOccurrences.push(date);
    }
  }

  return nextOccurrences;
}

function getNextDayOfWeek(dayOfWeek, startDate) {
  const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayOfWeek);
  const resultDate = new Date(startDate);
  resultDate.setDate(startDate.getDate() + (dayIndex + 7 - startDate.getDay()) % 7);
  return resultDate;
}

function getDayOfWeek(date) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
}
 



const updateDoctorAvailabilitty = async (req, res) => {
  const { availabilityId, doctorId, clinicId, days, slots } = req.body;

  try {
    const availability = await Availability.findById(availabilityId);
    if (!availability) {
      return res.status(404).json({ success: false, error: "Availability not found" });
    }

    const nextOccurrences = calculateNextOccurrences(days);

    const newAvailabilities = nextOccurrences.map(date => ({
      date: formatDate(date), // Format date as YYYY-MM-DD
      day: getDayOfWeek(date),
      slots: slots.map(slot => ({ timeSlot: slot, available: true }))
    }));

    for (const newAvailability of newAvailabilities) {
      const existingAvailability = await Availability.findOne({
        _id: { $ne: availabilityId },
        doctorId,
        'availabilities.date': newAvailability.date,
        'availabilities.slots.timeSlot': { $in: slots }
      });
      if (existingAvailability) {
        return res.status(400).json({ success: false, error: `Doctor has overlapping availability on ${newAvailability.date}` });
      }
    }

    availability.doctorId = doctorId;
    availability.clinicId = clinicId;
    availability.availabilities = newAvailabilities;

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
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false,message: errormesaages[1008], errorcode: 1008 });
    }
    const doctorData = await doctor.findOneAndUpdate(
      { mobile_number },
      { $set: { otp } },
    );


    // if (!doctorData) {
    //   return res.status(404).json({ success: false,message: errormesaages[1002], errorcode: 1002 });
    // }

    // if (!doctorData.otpVerified) {
    //   return res.status(400).json({ success: false, message: 'Your mobile number is not verified' });
    // }
    // if(!doctorData.verify){
    //   return res.status(400).json({ success: false, message: 'you are not verified by admin,contact admin' });
    
    // }

    // if (doctorData.block) {
    //   return res.status(400).json({ success: false, message: 'You are blocked by admin, contact admin' });
    // }

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
  const otp = "1234";

  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: errormesaages[1008], errorcode: 1008 });
    }

    let doctorData = await doctor.findOne({ mobile_number });

    if (doctorData) {
      const clinicExists = doctorData.clinics.some(c => c.clinicId.toString() === clinicId);
      if (clinicExists) {
        return res.status(400).json({ success: false,  message: errormesaages[1014], errorcode: 1014 });
      }
    } else {
      doctorData = new doctor({ mobile_number, clinics: [] });
    }

    doctorData.otp = otp;
    doctorData.clinics.push({ clinicId, verified: false });

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
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false,  message: errormesaages[1008], errorcode: 1008 });
    }
    if(!otp||otp===""){
      return res.status(400).json({ success: false, message: errormesaages[1015], errorcode: 1015 });

    }
    const doctorData = await doctor.findOne({ mobile_number });

    if (!doctorData) {
      return res.status(404).json({success:false,  message: errormesaages[1002], errorcode: 1002 });
    }

    if (otp !== doctorData.otp) {
      return res.status(400).json({ success:false,message: errormesaages[1016], errorcode: 1016 });
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
      return res.status(404).json({success:false, error: 'Doctor not found' });
    }

    const action = block ? 'blocked' : 'unblocked';
    res.json({ success: true, message: `Doctor ${action} successfully`, doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const get_availability=async (req, res) => {
  try {
    const { doctorId, clinicId, date, day } = req.query;
    let query = {};

    if (doctorId) {
      query.doctorId = doctorId;
    }
    if (clinicId) {
      query.clinicId = clinicId;
    }
    if (date) {
      query['availabilities.date'] = new Date(date);
    }
    if (day) {
      query['availabilities.day'] = day;
    }

    const availabilities = await Availability.find(query)
    
    res.json({ success: true, message: "Availabilities fetched successfully", availabilities });
  } catch (error) {
    console.error(error);
    res.status(500).json({success:false, error: "Internal Server Error" });
  }
}

const verify_certificate=async (req, res) => {
  const updateFields = {};

  if (req.body.undergraduate_certificate_verify !== undefined) {
    updateFields.undergraduate_certificate_verify = req.body.undergraduate_certificate_verify;
  }
  if (req.body.postgraduate_certificate_verify !== undefined) {
    updateFields.postgraduate_certificate_verify = req.body.postgraduate_certificate_verify;
  }

  try {
    const doctors = await doctor.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!doctors) {
      return res.status(404).json({success:false, message: 'Doctor not found' });
    }

    res.status(200).json({success:true, message: 'Certificate(s) verified', doctor });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
}

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
               sendDoctorOtpForLogin,
               get_availability,
               verify_certificate
                };
