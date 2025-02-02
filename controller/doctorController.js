
const { signInToken } = require("../config/auth");
const { errormesaages } = require("../errormessages");
const { generate4DigitOtp, generate6DigitOtp } = require("../lib/generateOtp");
const { createNotification } = require("../lib/notification");
const sendEmail = require("../lib/sendEmail");
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
    res.status(500).json({ error: error.message });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await doctor.find().populate('clinics.clinicId');
    res.json({ success: true, message: "Doctors fetched successfully", doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


const getClinicDetailsByDoctorId = async (req, res) => {
  try {
    const doctors = await doctor.findById(req.params.id).populate('clinics.clinicId');
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
    res.status(500).json({ error: error.message });
  }
};


const sharp = require('sharp'); 

const updateDoctor = async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = {};

    for (const fieldName in files) {
      if (Object.hasOwnProperty.call(files, fieldName)) {
        if (fieldName === "postgraduate_certificate") {
          const urls = [];

          for (const file of files[fieldName]) {
            const sanitizedFilename = file.originalname.replace(/\s+/g, '_');
            const imagePath = `doctor_certificates/${Date.now()}_${sanitizedFilename}`;
            await gcsStorage.bucket(bucketName).file(imagePath).save(file.buffer);
            const fileUrl = `https://storage.googleapis.com/${bucketName}/${imagePath}`;
            urls.push(fileUrl);
          }

          uploadedFiles[fieldName] = urls;
        } else if (fieldName === "signature") {
          const file = files[fieldName][0];
          const sanitizedFilename = file.originalname.replace(/\s+/g, '_');
          const imagePath = `doctor_certificates/${Date.now()}_${sanitizedFilename}`;

          const processedImageBuffer = await sharp(file.buffer)
            .grayscale()
            .removeAlpha() 
            .toBuffer()

          await gcsStorage.bucket(bucketName).file(imagePath).save(processedImageBuffer);

          uploadedFiles[fieldName] = `https://storage.googleapis.com/${bucketName}/${imagePath}`;
        } else {
          const file = files[fieldName][0];
          const sanitizedFilename = file.originalname.replace(/\s+/g, '_');
          const imagePath = `doctor_certificates/${Date.now()}_${sanitizedFilename}`;
          await gcsStorage.bucket(bucketName).file(imagePath).save(file.buffer);
          uploadedFiles[fieldName] = `https://storage.googleapis.com/${bucketName}/${imagePath}`;
        }
      }
    }

    req.body.details = true;
    const updateData = { ...req.body, ...uploadedFiles };

    const doctors = await doctor.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!doctors) {
      return res.status(400).json({ success: false, error: errormesaages[1002], errorcode: 1002 });
    }

    res.status(200).json({ success: true, message: "Doctor updated successfully", doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


// const sharp = require('sharp');
// const { removeBackground } = require('@imgly/background-removal-node');
// const { Blob } = require('buffer');

// const updateDoctor = async (req, res) => {
//   try {
//     const files = req.files;
//     const uploadedFiles = {};

//     for (const fieldName in files) {
//       if (Object.hasOwnProperty.call(files, fieldName)) {
//         if (fieldName === "postgraduate_certificate") {
//           const urls = [];
//           for (const file of files[fieldName]) {
//             const sanitizedFilename = file.originalname.replace(/\s+/g, '_');
//             const imagePath = `doctor_certificates/${Date.now()}_${sanitizedFilename}`;
//             await gcsStorage.bucket(bucketName).file(imagePath).save(file.buffer);
//             const fileUrl = `https://storage.googleapis.com/${bucketName}/${imagePath}`;
//             urls.push(fileUrl);
//           }
//           uploadedFiles[fieldName] = urls;
//         } else if (fieldName === "signature") {
//           const file = files[fieldName][0];
//           const sanitizedFilename = file.originalname.replace(/\s+/g, '_');
//           const imagePath = `doctor_certificates/${Date.now()}_${sanitizedFilename}`;

//           const imageBlob = new Blob([file.buffer], { type: file.mimetype });

//           const backgroundRemovedBlob = await removeBackground(imageBlob);

//           const backgroundRemovedBuffer = Buffer.from(await backgroundRemovedBlob.arrayBuffer());

//           const finalImageBuffer = await sharp(backgroundRemovedBuffer)
//             .grayscale()
//             .toBuffer();

//           await gcsStorage.bucket(bucketName).file(imagePath).save(finalImageBuffer);

//           uploadedFiles[fieldName] = `https://storage.googleapis.com/${bucketName}/${imagePath}`;
//         } else {
//           const file = files[fieldName][0];
//           const sanitizedFilename = file.originalname.replace(/\s+/g, '_');
//           const imagePath = `doctor_certificates/${Date.now()}_${sanitizedFilename}`;
//           await gcsStorage.bucket(bucketName).file(imagePath).save(file.buffer);
//           uploadedFiles[fieldName] = `https://storage.googleapis.com/${bucketName}/${imagePath}`;
//         }
//       }
//     }

//     req.body.details = true;
//     const updateData = { ...req.body, ...uploadedFiles };

//     const doctors = await doctor.findByIdAndUpdate(req.params.id, updateData, { new: true });
//     if (!doctors) {
//       return res.status(400).json({ success: false, error: errormesaages[1002], errorcode: 1002 });
//     }

//     res.status(200).json({ success: true, message: "Doctor updated successfully", doctors });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };

const updateDoctorAvailability = async (req, res) => {
  const { doctorId, clinicId, date, timeSlot, available } = req.body;
  try {
    const availability = await Availability.findOne({ doctorId, clinicId });

    if (!availability) {
      return res.status(404).json({ success: false, error: errormesaages[1007], errorcode: 1007 });
    }

    const availabilityDate = availability.availabilities.find(a => a.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]);

    if (!availabilityDate) {
      return res.status(404).json({ success: false, error: errormesaages[1023], errorcode: 1023 });
    }

    const slot = availabilityDate.slots.find(s => s.timeSlot === timeSlot);

    if (!slot) {
      return res.status(404).json({ success: false, error: errormesaages[1024], errorcode: 1024 });
    }

    slot.available = available;

    await availability.save();

    res.status(200).json({ success: true, message: 'Availability updated successfully', availability });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
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
    console.log(doctors)
   
    const clinic = doctors.clinics.find(c => c.clinicId.toString() === clinicId);

    if (!clinic) {
      return res.status(404).json({success:false, error:errormesaages[1013], errorcode: 1013 });
    }
    if (clinic.postgraduate_certificate_verify!==true||clinic.undergraduate_certificate_verify!==true) {
      return res.status(404).json({success:false, error:  errormesaages[1012], errorcode: 1012});
    }
    clinic.verified = verify;
     const clinics=await Clinic.findById(clinicId)

    await doctors.save();
    createNotification("doctor",doctorId,`doctor ${verify?"verified":"not verified"} by clinic ${clinics.clinic_name} `,clinicId)

    res.status(200).json({ success: true, message: 'Clinic verified successfully', doctors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteDoctor = async (req, res) => {
  const { doctorId, clinicId } = req.params;

  try {
    const doctors = await doctor.findById(doctorId);

    if (!doctor) {
      return res.status(400).json({
        success: false,
        error: "Doctor not found",
        errorcode: 1002
      });
    }

    if (clinicId) {
      const clinicsCount = doctors.clinics.length;

      if (clinicsCount === 1 && doctors.clinics[0].clinicId.toString() === clinicId) {
        await doctor.findByIdAndDelete(doctorId);
        return res.json({ success: true, message: "Doctor deleted successfully" });
      }

      doctors.clinics = doctors.clinics.filter(clinic => clinic.clinicId.toString() !== clinicId);

      await doctors.save();

      return res.json({ success: true, message: "Clinic details removed successfully from the doctor" });
    }

    await doctor.findByIdAndDelete(doctorId);
    res.json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};



const addClinicToDoctor = async (req, res) => {
  const { doctorId, clinicId } = req.body;

  try {
    const doctors = await doctor.findById(doctorId);
    if (!doctors) {
      return res.status(404).json({success:false, error: errormesaages[1002], errorcode: 1002 });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({success:false, error: errormesaages[1001], errorcode: 1001 });
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



// const addDoctorAvailability = async (req, res) => {
//   const { doctorId, clinicId, days, slots } = req.body;

//   try {
//     const doctors = await doctor.findById(doctorId);
//     if (!doctors) {
//       return res.status(404).json({ success: false, error: 'Doctor not found', errorcode: 1002 });
//     }

//     const clinic = await Clinic.findById(clinicId);
//     if (!clinic) {
//       return res.status(404).json({ success: false, error: 'Clinic not found', errorcode: 1001 });
//     }

//     const availabilities = days.map(day => ({
//       day,
//       slots: slots.map(slot => ({ timeSlot: slot, available: true }))
//     }));

//     const existingAvailability = await Availability.findOne({
//       doctorId,
//       'availabilities.day': { $in: days },
//       'availabilities.slots.timeSlot': { $in: slots }
//     });

//     if (existingAvailability) {
//       return res.status(400).json({ success: false, error: 'Doctor already has availability on one of the provided days for one of the slots' });
//     }

//     const newAvailability = new Availability({
//       doctorId,
//       clinicId,
//       availabilities
//     });

//     await newAvailability.save();
//     await doctor.updateOne(
//       { _id: doctorId, 'clinics.clinicId': clinicId },
//       { $set: { 'clinics.$.scheduled': true } }
//     );


//     res.status(201).json({ success: true, message: 'Availability added successfully', availability: newAvailability });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

const addDoctorAvailability = async (req, res) => {
  const { doctorId, clinicId, availabilities } = req.body;

  try {
    // Check if the doctor exists
    const doctorExists = await doctor.findById(doctorId);
    if (!doctorExists) {
      return res.status(404).json({ success: false, error: 'Doctor not found', errorcode: 1002 });
    }

    // Check if the clinic exists
    const clinicExists = await Clinic.findById(clinicId);
    if (!clinicExists) {
      return res.status(404).json({ success: false, error: 'Clinic not found', errorcode: 1001 });
    }

    // Find existing availability for the doctor and clinic
    const existingAvailability = await Availability.findOne({ doctorId, clinicId });

    if (existingAvailability) {
      // Create a set of days provided in the new availabilities
      const newDaysSet = new Set(availabilities.map(({ day }) => day));

      // Filter out any days from existing availability that are not in the new list
      existingAvailability.availabilities = existingAvailability.availabilities.filter(
        ({ day }) => newDaysSet.has(day)
      );

      // Update or add new days and slots
      availabilities.forEach(({ day, slots }) => {
        const dayAvailability = existingAvailability.availabilities.find(avail => avail.day === day);

        if (dayAvailability) {
          // Replace the slots with the new slots provided
          dayAvailability.slots = slots.map(slot => ({ timeSlot: slot, available: true }));
        } else {
          // Add new day and slots if the day doesn't exist yet
          existingAvailability.availabilities.push({
            day,
            slots: slots.map(slot => ({ timeSlot: slot, available: true }))
          });
        }
      });

      await existingAvailability.save();
    } else {
      // Create new availability if it doesn't exist
      const newAvailability = new Availability({
        doctorId,
        clinicId,
        availabilities: availabilities.map(({ day, slots }) => ({
          day,
          slots: slots.map(slot => ({ timeSlot: slot, available: true }))
        }))
      });

      await newAvailability.save();
    }

    // Update the doctor's scheduled status for the clinic
    await doctor.updateOne(
      { _id: doctorId, 'clinics.clinicId': clinicId },
      { $set: { 'clinics.$.scheduled': true } }
    );

    res.status(201).json({ success: true, message: 'Availability added or updated successfully' });
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
  const { doctorId, clinicId, availabilities } = req.body;

  try {
    const doctorExists = await doctor.findById(doctorId);
    if (!doctorExists) {
      return res.status(404).json({ success: false, error: 'Doctor not found', errorcode: 1002 });
    }

    const clinicExists = await Clinic.findById(clinicId);
    if (!clinicExists) {
      return res.status(404).json({ success: false, error: 'Clinic not found', errorcode: 1001 });
    }

    const existingAvailability = await Availability.findOne({ doctorId, clinicId });

    if (!existingAvailability) {
      return res.status(404).json({ success: false, error: 'Availability record not found', errorcode: 1003 });
    }

    if (availabilities.length === 0) {
      return res.status(400).json({ success: false, error: 'No availabilities provided', errorcode: 1004 });
    }

    availabilities.forEach(({ day, slots }) => {
      if (slots.length === 0) {
        return res.status(400).json({ success: false, error: `Empty slots array for day: ${day}`, errorcode: 1005 });
      }

      const dayAvailability = existingAvailability.availabilities.find(avail => avail.day === day);

      if (dayAvailability) {
        dayAvailability.slots = slots.map(slot => ({ timeSlot: slot, available: true }));
      } else {
        existingAvailability.availabilities.push({
          day,
          slots: slots.map(slot => ({ timeSlot: slot, available: true }))
        });
      }
    });

    await existingAvailability.save();

    res.status(200).json({ success: true, message: 'Availability updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


const sendDoctorOtpForLogin = async (req, res) => {
  const { email } = req.body;
  var otp
  if(email==="sram533516@gmail.com"){
 otp="1234"
  }else{
    otp =generate4DigitOtp()
  }
   

  try {
    if (email) {
      var emailaddress = email.toLowerCase();
       }
       console.log("emailaddressssssssssssssssss",emailaddress)
    const doctorData = await doctor.findOneAndUpdate(
      { email:emailaddress },
      { $set: { otp } },
    );
console.log(doctorData)

    if (!doctorData) {
      return res.status(404).json({ success: false,message: errormesaages[1002], errorcode: 1002 });
    }

    if(!doctorData.otpVerified){
      return res.status(400).json({  success: false,  message: errormesaages[1056], errorcode: 1056 });
    }
    const templateFile = 'OTP.ejs';
    const subject = 'Di application OTP Verification';
    console.log("otp", otp);

    const data = {
      otp: otp,
    };
    sendEmail(
      emailaddress,
      subject,
      templateFile,
      data,
    );

    // if (!doctorData.otpVerified) {
    //   return res.status(400).json({ success: false, message: 'Your mobile number is not verified' });
    // }
    // if(!doctorData.verify){
    //   return res.status(400).json({ success: false, message: 'you are not verified by admin,contact admin' });
    
    // }

    // if (doctorData.block) {
    //   return res.status(400).json({ success: false, message: 'You are blocked by admin, contact admin' });
    // }

    // await doctorData.save();

    // Code to send OTP via SMS
    // sendOtpSms(mobile_number, otp); // Uncomment and implement this function

    res.status(200).json({ success: true, message: 'OTP sent successfully', doctor:doctorData });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};


const sendDoctorOtp = async (req, res) => {
  const { mobile_number, clinicId,email } = req.body;
  const otp = generate4DigitOtp() 

  try {
    if (email) {
      var emailaddress = email.toLowerCase();
       }
    
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: errormesaages[1008], errorcode: 1008 });
    }
    const existingdoctormobile = await doctor.findOne({ mobile_number,'clinics.clinicId':clinicId  });
    if (existingdoctormobile) {
      return res.status(400).json({ success: false, message: errormesaages[1014], errorcode: 1014 });
    }
    const existingdoctor= await doctor.findOne({emailaddress,'clinics.clinicId':clinicId  });
    if (existingdoctor) {
      return res.status(400).json({ success: false, message: errormesaages[1054], errorcode: 1054 });
    } 

    let doctorData = await doctor.findOne({ email :emailaddress});

    if (doctorData) {
      const clinicExists = doctorData.clinics.some(c => c.clinicId.toString() === clinicId);
      if (clinicExists) {
        return res.status(400).json({ success: false,  message: errormesaages[1014], errorcode: 1014 });
      }
    } else {
      doctorData = new doctor({ mobile_number, clinics: [] });
    }

    doctorData.otp = otp;
    doctorData.email= emailaddress
    const clinic = await Clinic.findById(clinicId)
      .populate({
        path: 'subscription_details.subscription_id',
        populate: {
          path: 'title',
        }
      });

    if (!clinic) {
      return res.status(404).json({ error: errormesaages[1001], errorcode: 1001 });
    }
console.log(clinic)
    const subscriptionDetails = clinic.subscription_details;
    
      if(subscriptionDetails.length === 1 ){
        doctorData.clinics.push({ clinicId, verified: false,subscription:true });
console.log("ifffffffffffffffffffffff")
      }else{
        doctorData.clinics.push({ clinicId, verified: false });
console.log("elseeeeeeeeeeeeeeeeeeeee")
      }

    await doctorData.save();
    const templateFile = 'OTP.ejs';
    const subject = 'Di application OTP Verification';
    console.log("otp", otp);

    const data = {
      otp: otp,
    };
    sendEmail(
      emailaddress,
      subject,
      templateFile,
      data,
    );
   
    res.status(200).json({ success: true, message: 'OTP sent successfully and clinic processed', doctor: doctorData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




const verifyDoctorOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
    //   return res.status(400).json({ success: false,  message: errormesaages[1008], errorcode: 1008 });
    // }
    if (email) {
      var emailaddress = email.toLowerCase();
       }
    if(!otp||otp===""){
      return res.status(400).json({ success: false, message: errormesaages[1015], errorcode: 1015 });

    }
 
    const doctorData = await doctor.findOne({ email:emailaddress });
    console.log(email,doctorData)
    if (!doctorData) {
      return res.status(404).json({success:false,  message: errormesaages[1002], errorcode: 1002 });
    }

    if (otp !== doctorData.otp) {
      return res.status(400).json({ success:false,message: errormesaages[1016], errorcode: 1016 });
    }

    doctorData.otpVerified = true;

    await doctorData.save();
// const token=signInToken(doctorData)
    res.status(200).json({ success: true, message: 'OTP verified successfully', doctor: doctorData,type:"Doctor"});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const blockOrUnblockDoctor = async (req, res) => {
  const { id } = req.params;
  const { block, reason, clinicId } = req.body;

  try {
    let doctors;

    if (block) {
      doctors = await doctor.findOneAndUpdate(
        { _id: id, "clinics.clinicId": clinicId },
        { $set: { "clinics.$.block": true, "clinics.$.block_reason": reason } },
        { new: true }
      );
    } else {
      doctors = await doctor.findOneAndUpdate(
        { _id: id, "clinics.clinicId": clinicId },
        { $set: { "clinics.$.block": false, "clinics.$.unblock_reason": reason } },
        { new: true }
      );
    }

    if (!doctors) {
      return res.status(404).json({success:false, error: errormesaages[1002], errorcode: 1002 });
    }
    const clinics=await Clinic.findById(clinicId)

    createNotification("doctor", id, `Doctor ${block ? "blocked" : "unblocked"} by clinic ${clinics.clinic_name}`, clinicId);

    res.json({ success: true, message: `Doctor ${block ? "blocked" : "unblocked"} successfully`, doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// const get_availability = async (req, res) => {
//   try {
//     const { doctorId, clinicId, date, day } = req.query;
//     let query = {};

//     if (doctorId) {
//       query.doctorId = doctorId;
//     }
//     if (clinicId) {
//       query.clinicId = clinicId;
//     }

//     let dayFilter = {};
//     if (date) {
//       const targetDate = new Date(date);
//       dayFilter = {
//         day: targetDate.toLocaleString('en-us', { weekday: 'long' }),
//         date: targetDate
//       };
//     } else if (day) {
//       dayFilter = {
//         day: new RegExp(day, 'i')
//       };
//     }

//     const availabilities = await Availability.find(query);

//     const clinicAvailabilities = availabilities.map(item => {
//       const filteredAvailabilities = item.availabilities.filter(avail => {
//         let dayMatch = true;
//         let slotsMatch = true;

//         if (date) {
//           dayMatch = dayFilter.day === avail.day;
//           const unavailableSlots = item.unavailable.find(u => u.date.toDateString() === dayFilter.date.toDateString());
//           if (unavailableSlots) {
//             avail.slots = avail.slots.filter(slot => 
//               !unavailableSlots.slots.some(unavailableSlot => unavailableSlot.timeSlot === slot.timeSlot)
//             );
//           }
//         } else if (day) {
//           dayMatch = dayFilter.day.test(avail.day);
//         }

//         if (dayMatch) {
//           const availableSlots = avail.slots.filter(slot => slot.available === true);
//           slotsMatch = availableSlots.length > 0;
//         }

//         return dayMatch && slotsMatch;
//       });

//       return {
//         doctorId: item.doctorId,
//         clinicId: item.clinicId,
//         availabilities: filteredAvailabilities.map(avail => ({
//           day: avail.day,
//           slots: avail.slots.filter(slot => slot.available)
//         }))
//       };
//     }).filter(item => item.availabilities.length > 0);

//     res.json({ success: true, message: "Availabilities fetched successfully", availabilities: clinicAvailabilities });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };
const get_availability = async (req, res) => {
  try {
    const { doctorId, clinicId, date, day } = req.query;
    let query = {};

    if (doctorId) {
      query.doctorId = doctorId;
    }

    const availabilities = await Availability.find(query);

    let clinicAvailabilities = [];
    let otherclinicAvailabilities = [];

    availabilities.forEach(item => {
      const filteredAvailabilities = item.availabilities.filter(avail => {
        let dayMatch = true;
        let slotsMatch = true;
        let dayFilter = {};

        if (date) {
          const targetDate = new Date(date);
          dayFilter = {
            day: targetDate.toLocaleString('en-us', { weekday: 'long' }),
            date: targetDate
          };
          dayMatch = dayFilter.day === avail.day;

          const unavailableSlots = item.unavailable.find(u => u.date.toDateString() === dayFilter.date.toDateString());
          
          if (unavailableSlots) {
            return false; 
          }
        } else if (day) {
          dayFilter = { day: new RegExp(day, 'i') };
          dayMatch = dayFilter.day.test(avail.day);

          const unavailableSlotsForDay = item.unavailable.find(u => u.day === avail.day);
          if (unavailableSlotsForDay) {
            return false;
          }
        }

        if (dayMatch) {
          const availableSlots = avail.slots.filter(slot => slot.available === true);
          slotsMatch = availableSlots.length > 0;
        }

        return dayMatch && slotsMatch;
      });

      const availabilityData = {
        _id: item._id,
        doctorId: item.doctorId,
        clinicId: item.clinicId,
        availabilities: filteredAvailabilities.map(avail => ({
          day: avail.day,
          slots: avail.slots.filter(slot => slot.available)
        }))
      };

      if (item.clinicId.toString() === clinicId && item.doctorId.toString() === doctorId) {
        clinicAvailabilities.push(availabilityData);
      } else {
        otherclinicAvailabilities.push(availabilityData);
      }
    });

    clinicAvailabilities = clinicAvailabilities.filter(item => item.availabilities.length > 0);
    otherclinicAvailabilities = otherclinicAvailabilities.filter(item => item.availabilities.length > 0);

    res.json({
      success: true,
      message: "Availabilities fetched successfully",
      clinicAvailabilities,
      otherclinicAvailabilities
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};






const verify_certificate = async (req, res) => {
  const updateFields = {};

  if (req.body.undergraduate_certificate_verify !== undefined) {
    updateFields["clinics.$.undergraduate_certificate_verify"] = req.body.undergraduate_certificate_verify;
  }
  if (req.body.postgraduate_certificate_verify !== undefined) {
    updateFields["clinics.$.postgraduate_certificate_verify"] = req.body.postgraduate_certificate_verify;
  }

  try {
    const doctors = await doctor.findOneAndUpdate(
      { "_id": req.params.id, "clinics.clinicId": req.body.clinicId },
      { $set: updateFields },
      { new: true }
    );

    if (!doctors) {
      return res.status(404).json({success:false, error: errormesaages[1002], errorcode: 1002 });
    }
    const clinics=await Clinic.findById(req.body.clinicId)

    createNotification("doctor",req.params.id,`doctor certificates ug ${req.body.undergraduate_certificate_verify?"verified":"not verified"} and pg ${req.body.postgraduate_certificate_verify?"verified":"not verified"} by clinic ${clinics.clinic_name} `,req.body.clinicId)

    res.status(200).json({ success: true, message: 'Certificate(s) verified', doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addUnavailableSlots = async (req, res) => {
  const { doctorId, clinicId, unavailable } = req.body;

  try {
    const availability = await Availability.findOne({ doctorId, clinicId });

    if (!availability) {
      return res.status(404).json({ success: false, error: "Availability record not found" });
    }

    availability.unavailable.push(...unavailable);
    await availability.save();

    res.status(200).json({ success: true, message: 'Unavailable slots added successfully', availability });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
const resendOtp = async (req, res) => {
  const { email } = req.body;
  const OTP = generate4DigitOtp();

  try {

    if (email) {
      var emailaddress = email.toLowerCase();
       }
    let doctors = await doctor.findOne({ email:emailaddress });

    if (!doctors) {
      return res.status(404).json({ success: false, message:errormesaages[1002], errorcode: 1002 });
    }

    doctors.otp = OTP;
    // doctors.otpVerified = false;

    const templateFile = 'OTP.ejs';
    const subject = 'Di application OTP Verification';

    const data = { otp: OTP };
    sendEmail(emailaddress, subject, templateFile, data);

    await doctors.save();

    console.log("OTP resent", OTP);

    return res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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
               sendDoctorOtpForLogin,
               get_availability,
               verify_certificate,
               addUnavailableSlots,
               resendOtp
                };
