const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Patient = require('../modal/patient');
const { Storage } = require("@google-cloud/storage");
const { errormesaages } = require('../errormessages');
const Availability = require('../modal/availablity');
const doctor = require('../modal/doctor');
const { createNotification } = require('../lib/notification');
const PDFDocument = require('pdfkit');
const { promisify } = require('util');
const { PassThrough } = require('stream');
const stream = require('stream');
const moment = require('moment');
const { generate4DigitOtp } = require('../lib/generateOtp');
const sendEmail = require('../lib/sendEmail');
const Clinic = require('../modal/clinic.');
const Template = require('../modal/prescriptiontemplate');
const axios=require('axios')

require("dotenv").config();
const bucketName = process.env.bucketName;
const gcsStorage = new Storage();


// Add Patient
const addPatient = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.create(req.body);
    res.status(201).json({ success: true, message: "Patient added successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get All Patients
const getAllPatients = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { mobile_number, appointment_date, page = 1, limit = 10 } = req.query;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const mainDBConnection = mongoose.connection;
    let query = {};

    if (mobile_number) {
      query.mobile_number = { $regex: mobile_number, $options: 'i' };
    }

    if (appointment_date) {
      query['appointment_history.appointment_date'] = appointment_date;
    }

    const totalPatients = await PatientModel.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const patients = await PatientModel.find(query)
      .populate({
        path: 'appointment_history.doctor',
        model: mainDBConnection.model('doctor'),
      })
      .skip(startIndex)
      .limit(parseInt(limit));

    if (!patients.length) {
      return res.status(404).json({ success: false, error: errormesaages[1048], errorcode: 1048 });
    }

    const doctors = await mainDBConnection.model('doctor').find()
      .limit(limit)
      .skip(startIndex);

    const todayUTC = new Date().toISOString().split('T')[0]; // Outputs 'YYYY-MM-DD'

    const doctorAvailabilityPromises = doctors.map(async (doctor) => {
      const availabilityDoc = await Availability.findOne({
        doctorId: doctor._id,
        clinicId: req.user._id
      });

      let availabilityStatus = 'unavailable';
      if (availabilityDoc) {
        const todayAvailability = availabilityDoc.availabilities.find(avail => avail.day === new Date().toLocaleString('en-us', { weekday: 'long' }));
        const unavailableSlots = availabilityDoc.unavailable.find(u => u.date.toISOString().split('T')[0] === todayUTC);

        if (todayAvailability) {
          const availableSlots = todayAvailability.slots.filter(slot => {
            // Check if slot is in the unavailable slots
            return !unavailableSlots || !unavailableSlots.slots.some(unavailableSlot => unavailableSlot.timeSlot === slot.timeSlot);
          }).some(slot => slot.available);

          availabilityStatus = availableSlots ? 'available' : 'unavailable';
        }
      }

      return {
        doctor,
        availability: availabilityStatus
      };
    });

    const doctorAvailability = await Promise.all(doctorAvailabilityPromises);

    // Count available and unavailable doctors
    const availableDoctorsCount = doctorAvailability.filter(doc => doc.availability === 'available').length;
    const unavailableDoctorsCount = doctorAvailability.filter(doc => doc.availability === 'unavailable').length;

    res.json({
      success: true,
      message: "Patients fetched successfully",
      totalCount: totalPatients,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      startIndex: startIndex + 1,
      endIndex: endIndex > totalPatients ? totalPatients : endIndex,
      currentPage: parseInt(page),
      patients,
      availableDoctorsCount,
      unavailableDoctorsCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllPatientslist = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { mobile_number, appointment_date, page = 1, limit = 10 } = req.query;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const mainDBConnection = mongoose.connection;
    let query = {};

    if (mobile_number) {
      query.mobile_number = { $regex: mobile_number, $options: 'i' };
    }
query.bond={ $regex: "myself", $options: 'i' }

    const totalPatients = await PatientModel.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const patients = await PatientModel.find(query)
      .skip(startIndex)
      .limit(parseInt(limit))
      .select('name mobile_number address gender age dob otp otpVerified diagnose_reports bond appointment_history');

    const patientData = patients.map(patient => {
      const finishedVisits = patient.appointment_history.filter(appointment => appointment.status === 'FINISHED');
      const totalVisits = finishedVisits.length;
      const lastVisit = totalVisits > 0 
      ? finishedVisits[totalVisits - 1].appointment_date 
      : null;
      // Remove appointment history from the result
      const { appointment_history, ...patientWithoutHistory } = patient.toObject();

      return {
        ...patientWithoutHistory,
        totalVisits,
        lastVisit,
      };
    });

    res.json({
      success: true,
      message: "Patients fetched successfully",
      totalCount: totalPatients,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      startIndex: startIndex + 1,
      endIndex: endIndex > totalPatients ? totalPatients : endIndex,
      currentPage: parseInt(page),
      patients: patientData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getAllrelationlist = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { mobile_number } = req.query;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    let query = {};
    query.bond = { $ne: "myself" };
    if (mobile_number) {
      query.mobile_number = { $regex: mobile_number, $options: 'i' };
    }

    const totalPatients = await PatientModel.countDocuments(query);
   
    const patients = await PatientModel.find(query)
    .select('name bond ');



    res.json({
      success: true,
      message: "Patients fetched successfully",
      totalCount: totalPatients,
   
      patients: patients,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPatients = async (req, res) => {
  try {
    // Get the date from the query parameters
    const { date } = req.query;
    const { doctor } = req.params;

    // Parse the date string from DD-MM-YYYY to a Date object
    const [day, month, year] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);

    const formattedDate = date
    
    console.log(`Formatted Date: ${formattedDate}`);

    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patients = await PatientModel.aggregate([
      {
        $addFields: {
          filtered_appointment_history: {
            $filter: {
              input: "$appointment_history",
              as: "appointment",
              cond: {
                $and: [
                  { $eq: ["$$appointment.doctor", new mongoose.Types.ObjectId(doctor)] },
                  { $eq: ["$$appointment.appointment_date", formattedDate] },
                  { $ne: ["$$appointment.status", "FINISHED"] }
                ]
              }
            }
          }
        }
      },
      {
        $match: {
          "filtered_appointment_history.0": { $exists: true } // Ensure there is at least one matching appointment
        }
      },
      {
        $unwind: {
          path: "$filtered_appointment_history",
          preserveNullAndEmptyArrays: false // Remove documents with empty appointment history
        }
      },
      {
        $lookup: {
          from: 'doctors', // Adjust this to your actual collection name
          localField: 'filtered_appointment_history.doctor',
          foreignField: '_id',
          as: 'filtered_appointment_history.doctor'
        }
      },
      {
        $unwind: {
          path: "$filtered_appointment_history.doctor",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          mobile_number: { $first: "$mobile_number" },
          bond: { $first: "$bond" },
          createdAt: { $first: "$createdAt" },
          diagnose_reports: { $first: "$diagnose_reports" },
          otp: { $first: "$otp" },
          otpVerified: { $first: "$otpVerified" },
          updatedAt: { $first: "$updatedAt" },
          address: { $first: "$address" },
          age: { $first: "$age" },
          dob: { $first: "$dob" },
          gender: { $first: "$gender" },
          appointment_history: { $push: "$filtered_appointment_history" }
        }
      }
    ]);

    console.log(`Patients Found: ${JSON.stringify(patients, null, 2)}`);

    res.json({ success: true, message: "Patients fetched successfully", patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// Get Patient by ID
const getPatientById = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { id } = req.params;
    const { viewall } = req.query;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const mainDBConnection = mongoose.connection;
    const patient = await PatientModel.findById(id).populate({
      path: 'appointment_history.doctor',
      model: mainDBConnection.model('doctor')
    });
    if (!patient) {
      return res.status(404).json({success:false, error:  errormesaages[1021], errorcode: 1005 });
    }
    const finishedVisits = patient.appointment_history.filter(appointment => appointment.status === 'FINISHED');
    const totalVisits = finishedVisits.length;
    res.json({
      success: true,
      message: "Patient fetched successfully",
      totalVisits,
      appointment_history: viewall ? patient.appointment_history : patient.appointment_history.slice(0, 5),
      patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update Patient
const updatePatient = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { id } = req.params;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    
    const patient = await PatientModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!patient) {
      return res.status(404).json({success:false, error: errormesaages[1021], errorcode: 1021 });
    }
    
    res.status(200).json({ success: true, message: "Patient updated successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete Patient
const deletePatient = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(400).json({success:false, error: errormesaages[1021], errorcode: 1021 });
    }
    res.json({ success: true, message: "Patient deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Send Patient OTP
const sendPatientOtp = async (req, res) => {
  const { email,mobile_number } = req.body;
  const otp = generate4DigitOtp(); 
  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false,  message: errormesaages[1008], errorcode: 1008});
    }
    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findOneAndUpdate(
      { email },
      { otp ,mobile_number},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, message: 'OTP sent successfully', patient });
    const templateFile = 'OTP.ejs';
    const subject = 'Di application OTP Verification';
    console.log("otp", otp);

    const data = {
      otp: otp,
    };
    sendEmail(
      email,
      subject,
      templateFile,
      data,
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Verify Patient OTP
const verifyPatientOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    // if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
    //   return res.status(400).json({ success: false,  message: errormesaages[1008], errorcode: 1008 });
    // }
    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findOne({ email });
    if (!patient) {
      return res.status(404).json({success:false, error: errormesaages[1021] ,errorcode:1021});
    }
    if (otp !== patient.otp) {
      return res.status(400).json({success:false, error:  errormesaages[1016],errorcode:1016 });
    }
    patient.otpVerified = true;
    await patient.save();
    res.status(200).json({ success: true, message: 'OTP verified successfully', patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const resendOtp = async (req, res) => {

  const { tenantDBConnection } = req;
  const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
  const { email } = req.body;
  const OTP = generate4DigitOtp();

  try {
    let patient = await PatientModel.findOne({ email });

    if (!patient) {
      return res.status(404).json({ success: false, message:errormesaages[1021], errorcode: 1021 });
    }

    patient.otp = OTP;
    // doctors.otpVerified = false;

    const templateFile = 'OTP.ejs';
    const subject = 'Di application Resend OTP Verification';

    const data = { otp: OTP };
    sendEmail(email, subject, templateFile, data);

    await patient.save();

    console.log("OTP resent", OTP);

    return res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const updateAppointmentWithPrescription = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, appointmentId, prescription, medicines } = req.body;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found', errorcode: 1021 });
    }

    const appointment = patient.appointment_history.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', errorcode: 1028 });
    }

    if (medicines && Array.isArray(medicines)) {
      appointment.medicines = medicines.map(medicine => ({
        name: medicine.name,
        dosage: medicine.dosage,
        timings: {
          morning: !!medicine.timings?.morning,
          afternoon: !!medicine.timings?.afternoon,
          evening: !!medicine.timings?.evening,
          beforeFood: !!medicine.timings?.beforeFood,
          afterFood: !!medicine.timings?.afterFood
        }
      }));
    } else {
      return res.status(400).json({ success: false, error: 'Invalid medicines data', errorcode: 1029 });
    }

    appointment.prescription = prescription;
    appointment.status = "FINISHED";
    await patient.save();

    const clinic = await Clinic.findOne({ _id: req.user._id }).exec();
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found', errorcode: 1030 });
    }

    const doctors = await doctor.findById(appointment.doctor).exec();
    if (!doctors) {
      return res.status(404).json({ success: false, error: 'Doctor not found', errorcode: 1031 });
    }

    const template = await Template.findOne({ clinic_id: req.user._id }).exec();
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found', errorcode: 1032 });
    }

    // Create PDF and store it in a buffer
    const doc = new PDFDocument({ size: 'A4' });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      const data = { name: patient.name };
      const emailSubject = `You have received a prescription receipt from ${clinic.clinic_name}`;
      
      await sendEmail(
        patient.email,
        emailSubject,
        "sendrecipt.ejs",
        data,
        {
          filename: 'prescription_report.pdf',
          content: pdfData,
          contentType: 'application/pdf',
        }
      );

      res.status(200).json({ success: true, message: "Prescription and medicines added successfully", patient });
    });

    if (template.logo) {
      const imageUrl = template.logo;
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');
      doc.image(imageBuffer, { fit: [100, 100], align: 'left', valign: 'top' });
      doc.moveDown();
    }

    const applyStyles = (text, styles) => {
      if (styles.size) doc.fontSize(parseInt(styles.size, 10));
      if (styles.color) doc.fillColor(styles.color);
      if (styles.align) doc.text(text, { align: styles.align });
      else doc.text(text);
    };

    // Apply dynamic styles and values for clinic details
    template.dynamicFields.forEach(field => {
      if (field.section === 'clinicDetails') {
        let value = '';

        switch (field.name) {
          case 'Clinic Name':
            value = clinic.clinic_name;
            break;
          case 'Address':
            value = clinic.address;
            break;
            case 'Contact number':
              value = clinic.mobile_number;
              break;
              
          default:
            value = ''; 
        }

        applyStyles(`${field.name}: ${value}`, field.styles);
      }
    });
    doc.moveDown(1);

    template.dynamicFields.forEach(field => {
      if (field.section === 'doctorDetails') {
        let value = '';

        switch (field.name) {
          case 'Doctor Name':
            value = doctors.name;
            break;
          case 'Speciality':
            value = doctors.specialist;
            break;
            case 'Degree':
              value = doctors.pg_qualification||doctors.ug_qualification;
              break;
             
          default:
            value = ''; 
        }

        applyStyles(`${field.name}: ${value}`, field.styles);
      }
    });
    doc.moveDown(1);

    template.dynamicFields.forEach(field => {
      if (field.section === 'patientDetails') {
        let value = '';

        switch (field.name) {
          case 'Patient Name':
            value = patient.name;
            break;
          case 'Age':
            value = patient.age;
            break;
          case 'Gender':
            value = patient.gender;
            break;
          case 'Date':
            value = prescription.date;
            break;
          default:
            value = ''; 
        }

        applyStyles(`${field.name}: ${value}`, field.styles);
      }
    });
    doc.moveDown(1);

    template.dynamicFields.forEach(field => {
      if (field.section === 'prescriptionDetails') {
        let value = '';

        switch (field.name) {
          case 'Provisional Diagnosis':
            value = prescription.provisional_diagnosis;
            break;
          case 'Advice':
            value = prescription.advice;
            break;
          case 'Clinical Notes':
            value = prescription.clinical_notes;
            break;
          case 'Observation':
            value = prescription.observation;
            break;
          case 'Investigation with Reports':
            value = prescription.investigation_with_repo;
            break;
          default:
            value = '';
        }

        applyStyles(`${field.name}: ${value}`, field.styles);
      }
    });
    doc.moveDown(1);

    template.dynamicFields.forEach(field => {
      if (field.section === 'medicines') {
        applyStyles(field.name, field.styles); 

        medicines.forEach(medicine => {
          switch (field.name) {
            case 'Medicine Name':
              applyStyles(`- ${medicine.name}`, field.styles);
              break;
            case 'Dosage':
              applyStyles(`  Dosage: ${medicine.dosage}`, field.styles);
              break;
            case 'Timings':
              applyStyles(`  Timings: Morning: ${medicine.timings.morning ? 'Yes' : 'No'}, Afternoon: ${medicine.timings.afternoon ? 'Yes' : 'No'}, Evening: ${medicine.timings.evening ? 'Yes' : 'No'}`, field.styles);
              break;
            case 'Before Food':
              applyStyles(`  Before Food: ${medicine.timings.beforeFood ? 'Yes' : 'No'}`, field.styles);
              break;
            case 'After Food':
              applyStyles(`  After Food: ${medicine.timings.afterFood ? 'Yes' : 'No'}`, field.styles);
              break;
            default:
              break;
          }
        });
      }
    });
    doc.moveDown(1);

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getPrescription = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, appointmentId } = req.body;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    
    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({success:false, error: errormesaages[1021], errorcode: 1021 });
    }

    const appointment = patient.appointment_history.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({success:false, error: errormesaages[1028], errorcode: 1028 });
    }

    res.status(200).json({ 
      success: true, 
      message: "Prescription fetched successfully", 
      prescription: appointment.prescription,
      medicines: appointment.medicines
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const addAppointmentWithToken = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const clinicId=req.user._id
    const { patientId, appointment_date, time, reason, doctorId, temp, Bp } = req.body;

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      return res.status(404).json({ success: false, error: errormesaages[1021], errorcode: 1021 });
    }

    const appointmentDate = moment(appointment_date, 'DD-MM-YYYY');
    const currentDate = moment();

    if (appointmentDate.isBefore(currentDate, 'day') || appointmentDate.diff(currentDate, 'days') > 7) {
      return res.status(400).json({ success: false, error: errormesaages[1039], errorcode: 1039 });
    }

    const dayOfWeek = appointmentDate.format('dddd');
console.log(clinicId,doctorId,dayOfWeek)
    const availability = await Availability.findOne({
      doctorId,
      clinicId,
      'availabilities.day': dayOfWeek
    });

    if (!availability) {
      return res.status(400).json({ success: false, error: "Doctor is not available on this day at the selected clinic.", errorcode: 1040 });
    }

    const dayAvailability = availability.availabilities.find(avail => avail.day === dayOfWeek);
    const timeSlot = dayAvailability.slots.find(slot => slot.timeSlot === time && slot.available);

    if (!timeSlot) {
      return res.status(400).json({ success: false, error: "Doctor is not available at this time at the selected clinic.", errorcode: 1041 });
    }

    const unavailableSlot = availability.unavailable.find(unavail => 
      moment(unavail.date).isSame(appointmentDate, 'day') &&
      unavail.slots.some(slot => slot.timeSlot === time && slot.available === false)
    );

    if (unavailableSlot) {
      return res.status(400).json({ success: false, error: "Doctor is unavailable for this date and time at the selected clinic.", errorcode: 1042 });
    }

    const allPatients = await PatientModel.find({
      'appointment_history.appointment_date': appointment_date,
      'appointment_history.doctor': doctorId,
    });

    let tokenCount = 0;
    allPatients.forEach(patient => {
      tokenCount += patient.appointment_history.filter(a => 
        a.appointment_date === appointment_date && 
        a.doctor.toString() === doctorId
      ).length;
    });

    const newTokenNumber = tokenCount + 1;
    const newAppointment = {
      appointment_date,
      time,
      reason,
      doctor: doctorId,
     
      token_number: newTokenNumber,
      temp,
      Bp
    };

    patient.appointment_history.push(newAppointment);

    await patient.save();

    createNotification("doctor", doctorId, `You have an appointment on ${appointment_date} at ${time} at clinic ${clinicId}`);

    res.status(200).json({ success: true, message: "Appointment added successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const addFollowUpAppointment = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, previousAppointmentId, appointment_date } = req.body;

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      return res.status(404).json({ success: false, error: errormesaages[1021], errorcode: 1021 });
    }

    const previousAppointment = patient.appointment_history.id(previousAppointmentId);

    if (!previousAppointment) {
      return res.status(404).json({ success: false, error: errormesaages[1022], errorcode: 1022 });
    }

    const currentDate = moment();
    const followUpDate = moment(appointment_date, 'DD-MM-YYYY'); 

    if (followUpDate.isBefore(currentDate, 'day') || followUpDate.diff(currentDate, 'days') > 7) {
      return res.status(400).json({  success: false, error:errormesaages[1039], errorcode: 1039 });
    }

    previousAppointment.follow_up_from = true;
    previousAppointment.follow_up_date = followUpDate.format('DD-MM-YYYY');

    await patient.save();

    res.status(200).json({ success: true, message: "Follow-up appointment updated successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const getPatientsWithTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    console.log("Start of Day:", startOfDay);
    console.log("End of Day:", endOfDay);

    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patients = await PatientModel.aggregate([
      {
        $unwind: '$appointment_history' 
      },
      {
        $match: {
          'appointment_history.appointment_date': {
            $gte: startOfDay,
            $lte: endOfDay
          }
        },
        $match: {
          'appointment_history.doctor':req?.params.doctor
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          mobile_number: { $first: '$mobile_number' },
          address: { $first: '$address' },
          appointment_history: { $push: '$appointment_history' }
        }
      }
    ]);

    res.status(200).json({ success: true, message: 'Patients with today\'s appointments fetched successfully', patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const upload_diagnose_report =async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId } = req.params;
    const { report_name } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const PatientModel = tenantDBConnection.model('Patient',Patient.schema);
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      return res.status(404).json({ error:  errormesaages[1021], errorcode: 1021 });
    }
    const currentDate = moment().format('DD-MM-YYYY'); 
    const originalFilename = `${patient.name}_${currentDate}`;
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.]/g, '_');
    const imagePath = `receptionst/${Date.now()}_${sanitizedFilename}`;
    await gcsStorage.bucket(bucketName).file(imagePath).save(req.file.buffer);
    
    const diagnoseReportUrl = `https://storage.googleapis.com/${bucketName}/${imagePath}`;

    const diagnoseReport = {
      report_name,
      diagnose_report: diagnoseReportUrl
    };

    patient.diagnose_reports.push(diagnoseReport);
    await patient.save();

    res.status(201).json({ success: true, message: 'Diagnose report uploaded successfully', patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
const get_diagnose_report=async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    if (!tenantDBConnection) {
      return res.status(500).json({success:false, error: 'Tenant DB connection is not set' });
    }

    const { patientId } = req.params;

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      return res.status(404).json({success:false, error: errormesaages[1021], errorcode: 1021 });
    }

    const diagnoseReports = patient.diagnose_reports;

    res.status(200).json({ success: true, diagnoseReports,patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


const getFollowUpList = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    if (!tenantDBConnection) {
      return res.status(500).json({ success: false, error: 'Tenant DB connection is not set' });
    }
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    const todayString = moment(today).format('DD-MM-YYYY');
    const tomorrowString = moment(tomorrow).format('DD-MM-YYYY');
    const dayAfterTomorrowString = moment(dayAfterTomorrow).format('DD-MM-YYYY');

    console.log('Dates:', { todayString, tomorrowString, dayAfterTomorrowString });

    const patients = await PatientModel.find({
      'appointment_history': {
        $elemMatch: {
          follow_up_from: { $exists: true, $ne: null },
        }
      }
    });

    console.log('Found patients:', patients.length);

    const followUpList = patients.map(patient => {
      console.log('Patient appointment history:', patient.appointment_history);

      const filteredAppointments = patient.appointment_history.filter(appointment => {
     
        console.log('Formatted appointment date:',appointment.appointment_date);
        return [todayString, tomorrowString, dayAfterTomorrowString].includes(appointment.appointment_date) &&
          appointment.follow_up_from;
      });

      console.log('Filtered appointments for patient:', filteredAppointments);

      return {
        ...patient.toObject(),
        appointment_history: filteredAppointments
      };
    });

    res.status(200).json({ success: true, followUpList });
  } catch (error) {
    console.error('Error in getFollowUpList:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};






module.exports = {
  addPatient,
  getAllPatients,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  sendPatientOtp,
  verifyPatientOtp,
  updateAppointmentWithPrescription,
  getPrescription,
  addAppointmentWithToken,
  addFollowUpAppointment,
  getPatientsWithTodayAppointments,
  upload_diagnose_report,
  get_diagnose_report,
  getFollowUpList,
  getAllPatientslist,
  getAllrelationlist,
  resendOtp
};
