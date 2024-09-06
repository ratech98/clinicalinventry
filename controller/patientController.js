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
    res.status(500).json({ error: error.message });
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
      return res.status(200).json({ success: true, patients: [] });
    }

    const doctors = await mainDBConnection.model('doctor').find({ "clinics.clinicId": req.user._id })
    .limit(limit)
    .skip(startIndex);

  const todayUTC = new Date().toISOString().split('T')[0]; 

  const doctorAvailabilityPromises = doctors.map(async (doctor) => {
    const availabilityDoc = await Availability.findOne({
      doctorId: doctor._id,
      clinicId: req.user._id
    });

    let availabilityStatus = 'unavailable';
    if (availabilityDoc) {
      const unavailableDates = availabilityDoc.unavailable.map(u => u.date.toISOString().split('T')[0]);

      if (unavailableDates.includes(todayUTC)) {
        availabilityStatus = 'unavailable';
      } else {
        const todayAvailability = availabilityDoc.availabilities.find(avail => avail.day === new Date().toLocaleString('en-us', { weekday: 'long' }));
        if (todayAvailability) {
          const availableSlots = todayAvailability.slots.some(slot => slot.available);
          availabilityStatus = availableSlots ? 'available' : 'unavailable';
        }
      }
    }

    return {
      doctor,
      availability: availabilityStatus
    };
  });

  const doctorAvailability = await Promise.all(doctorAvailabilityPromises);

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
      patients:patients?patients:[],
      availableDoctorsCount,
      unavailableDoctorsCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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
// query.bond={ $regex: "myself", $options: 'i' }

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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
console.log(appointment)
    if (medicines && Array.isArray(medicines)) {
      appointment.medicines = medicines.map(medicine => ({
        name: medicine.name,
        dosage: medicine.dosage,
        count:medicine.count,
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
    console.log(clinic)

    const doctors = await doctor.findById(appointment.doctor).exec();
    if (!doctors) {
      return res.status(404).json({ success: false, error: 'Doctor not found', errorcode: 1031 });
    }

    const template = await Template.findOne({ clinic_id: req.user._id }).exec();
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found', errorcode: 1032 });
    }


    const createPdf = async (doc, content, styles = {}) => {
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        content.callback(pdfData);
      });
    console.log("appointment",appointment)
      const defaultStyles = {
        margin: 20,
        fontSize: 10,
        fontColor: 'black',
        font: "Helvetica"
      };
      const appliedStyles = { ...defaultStyles, ...styles };
    
      doc.margin = appliedStyles.margin;
    
      const getStyles = (section, name) => {
        const field = template.dynamicFields.find(
          (field) => field.section === section && field.name === name
        );
        return field ? field.styles : {};
      };
    
      const dynamicAddressField = template.dynamicFields.find(
        (field) => field.section === 'clinicDetails' && field.name === 'Address'
      );
      const clinicAddress = dynamicAddressField && dynamicAddressField.value ? dynamicAddressField.value : "";
      console.log("clinicAddress", clinicAddress);
    
      const applyStyles = (doc, fieldStyles) => {
        doc.font("Helvetica")
          .fontSize(parseInt(fieldStyles.size) || appliedStyles.fontSize)
          .fillColor(fieldStyles.color || appliedStyles.fontColor);
      };
    
      let logoHeight = 0;
      let logoTopY = appliedStyles.margin;
      if (template.logo) {
        try {
          const imageUrl = template.logo;
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(response.data, 'binary');
    
          const availableWidth = doc.page.width * 0.10; // Reduced width
          const img = doc.openImage(imageBuffer);
          const scalingFactor = availableWidth / img.width;
          const finalWidth = img.width * scalingFactor;
          logoHeight = img.height * scalingFactor;
    
          // Define the circular clipping path
          const circleRadius = finalWidth / 2;
          const centerX = appliedStyles.margin + circleRadius;
          const centerY = logoTopY + circleRadius;
    
          // Clip to a circle
          doc.save()
            .translate(centerX, centerY)
            .circle(0, 0, circleRadius)
            .clip()
            .image(imageBuffer, -circleRadius, -circleRadius, {
              width: finalWidth,
              height: logoHeight,
            })
            .restore();
    
        } catch (error) {
          console.error('Error loading logo image:', error);
        }
      }
    
      const clinicDetailsX = appliedStyles.margin + 100;
      const doctorDetailsX = doc.page.width - appliedStyles.margin - 200;
      const maxWidthBeforeMidLine = (doc.page.width / 2) - clinicDetailsX - 10;
    
      let currentY = logoTopY;
    
      applyStyles(doc, getStyles('clinicDetails', 'Clinic Name'));
      doc.text(clinic.clinic_name, clinicDetailsX, currentY, {
        width: maxWidthBeforeMidLine,
        ellipsis: true
      });
      currentY += doc.heightOfString(clinic.clinic_name, { width: maxWidthBeforeMidLine }) + 5;
    
      applyStyles(doc, getStyles('clinicDetails', 'Contact number'));
      doc.text(clinic.mobile_number, clinicDetailsX, currentY, {
        width: maxWidthBeforeMidLine,
        ellipsis: true
      });
      currentY += doc.heightOfString(clinic.mobile_number, { width: maxWidthBeforeMidLine }) + 5;
    
      applyStyles(doc, getStyles('clinicDetails', 'Address'));
      doc.text(clinicAddress, clinicDetailsX, currentY, {
        width: maxWidthBeforeMidLine,
        ellipsis: true
      });
      currentY += doc.heightOfString(clinicAddress, { width: maxWidthBeforeMidLine }) + 5;
    
      const verticalLineX = (clinicDetailsX + (doc.page.width - appliedStyles.margin - 100)) / 2;
      const verticalLineEndY = currentY + 20; 
      doc.moveTo(verticalLineX, logoTopY)
        .lineTo(verticalLineX, verticalLineEndY)
        .lineWidth(0.5)
        .stroke();
    
      currentY = logoTopY; // Align with the top of the logo
      applyStyles(doc, getStyles('doctorDetails', 'Doctor Name'));
      doc.text(` ${doctors.name}`, doctorDetailsX, currentY, { align: 'right' });
      currentY += doc.heightOfString(doctors.name) + 5;
    
      applyStyles(doc, getStyles('doctorDetails', 'Speciality'));
      doc.text(` ${doctors.specialist}`, doctorDetailsX, currentY, { align: 'right' });
      currentY += doc.heightOfString(doctors.specialist) + 5;
    
      const pgQualification = Array.isArray(doctors.pg_qualification) 
        ? doctors.pg_qualification.join(', ') 
        : doctors.pg_qualification || '';
    
      const ugQualification = doctors.ug_qualification || '';
      const qualifications = [ugQualification, pgQualification].filter(Boolean).join(', ');
    
      applyStyles(doc, getStyles('doctorDetails', 'Degree'));
      doc.text(` ${qualifications}`, doctorDetailsX, currentY, { align: 'right' });
      currentY += doc.heightOfString(qualifications || "MBBS") + 5;
    
      currentY += 10;
      doc.moveTo(appliedStyles.margin, currentY)
        .lineTo(doc.page.width - appliedStyles.margin, currentY)
        .lineWidth(0.5)
        .stroke();
    
      currentY += 20;
    
      applyStyles(doc, getStyles('patientDetails', 'Patient Name'));
      doc.text(`Patient Name: ${patient.name}`, appliedStyles.margin, currentY, { continued: true });
      doc.text(`                                          `, { continued: true });
      applyStyles(doc, getStyles('patientDetails', 'Age'));
      doc.text(`Age: ${patient.age}`, { continued: true });
      doc.text(`                  `, { continued: true });
      applyStyles(doc, getStyles('patientDetails', 'Gender'));
      doc.text(`Gender: ${patient.gender}`, { continued: true });
      doc.text(`                 `, { continued: true });
    
    
      currentY += 20;
      doc.moveTo(appliedStyles.margin, currentY)
        .lineTo(doc.page.width - appliedStyles.margin, currentY)
        .lineWidth(0.5)
        .stroke();
        currentY += 20;

        if (prescription && prescription.date) {
          const formattedDate = prescription.date // Format the date from appointment.prescription
          applyStyles(doc, getStyles('prescriptionDetails', 'Date'));
        
          // Print the date right-aligned
          doc.text(`Date: ${formattedDate}`, appliedStyles.margin, currentY, {
            align: 'right',
            width: doc.page.width - 2 * appliedStyles.margin, // Set the width to align properly
          });
        
          // Move to the next line
          currentY += doc.heightOfString(`Date: ${formattedDate}`) + 10; // Add gap after date
        }
        
        if (prescription) {
          applyStyles(doc, getStyles('prescriptionDetails', 'Prescription Details'));
          doc.text('Prescription Details', appliedStyles.margin, currentY,{ underline: true });
          currentY += 35; 
        
          const prescriptionFields = prescription
          const keys = Object.keys(prescriptionFields)
            .filter(key => !key.startsWith('$') && key !== '_id' && key !== 'date'); 
        
          keys.forEach((key) => {
            const fieldValue = prescriptionFields[key]; 
            const fieldLabel = key.replace(/_/g, ' '); 
        
            const fieldStyle = getStyles('prescriptionDetails', key);
            applyStyles(doc, fieldStyle);
        
            const displayValue = fieldValue !== null && fieldValue !== undefined ? fieldValue : 'N/A';
            
            doc.text(`${fieldLabel}:`, appliedStyles.margin, currentY);
            currentY += doc.heightOfString(`${fieldLabel}:`) + 5; 
            doc.text(displayValue, appliedStyles.margin + 80, currentY); 
        
            currentY += doc.heightOfString(displayValue) + 5;
          });
        } else {
          applyStyles(doc, getStyles('prescriptionDetails', 'No Prescription Data'));
          doc.text('No prescription data available.', appliedStyles.margin, currentY);
          currentY += doc.heightOfString('No prescription data available.') + 5;
        }
        
      if (medicines && medicines.length > 0) {
        currentY += 20;
        applyStyles(doc, getStyles('medicines', 'Medicine Details'));
        doc.text('Medicines Details', appliedStyles.margin, currentY, { underline: true });
        currentY += doc.heightOfString('Medicines Details') + 10; // Add gap between header and table
      
        applyStyles(doc, getStyles('medicines', 'Headers'));
        const margin = appliedStyles.margin;
        const columnWidth = 100; // Adjust width for each column
        const columnSpacing = 10; // Space between columns
      
        doc.text('S.No', margin, currentY);
        doc.text('Medicine Name', margin + columnWidth*0.5, currentY);
        doc.text('Dosage', margin + columnWidth * 2, currentY);
        doc.text('Timings', margin + columnWidth * 2.5, currentY);
        doc.text('When to Consume', margin + columnWidth * 4, currentY);
      
        currentY += doc.heightOfString('Headers') + 5; // Adjust for subheaders
      
        medicines.forEach((medicine, index) => {
          let timings = [];
          let whenConsume = [];
      
          if (medicine.timings.morning) {
            timings.push('Morning');
          }
          if (medicine.timings.afternoon) {
            timings.push('Afternoon');
          }
          if (medicine.timings.evening) {
            timings.push('Evening');
          }
      
          // Populate the When to Consume array based on true values
          if (medicine.timings.beforeFood) {
            whenConsume.push('Before Food');
          }
          if (medicine.timings.afterFood) {
            whenConsume.push('After Food');
          }
      
          applyStyles(doc, getStyles('medicines', 'Row'));
          doc.text(`${index + 1}`, margin, currentY);
          doc.text(medicine.name, margin + columnWidth*0.5, currentY);
          doc.text(medicine.dosage, margin + columnWidth * 2, currentY);
      
          const timingsText = timings.length > 0 ? timings.join(', ') : 'None';
          doc.text(timingsText, margin + columnWidth * 2.5, currentY);
      
          const whenConsumeText = whenConsume.length > 0 ? whenConsume.join(', ') : 'None';
          console.log('When to Consume:', whenConsumeText);
          doc.text(whenConsumeText, margin + columnWidth * 4, currentY);
      
          currentY += doc.heightOfString('M') + 10; 
        });
      
        doc.moveDown(); 
      } else {
        applyStyles(doc, getStyles('medicines', 'No Medicines Data'));
        doc.text('No medicines data available.', appliedStyles.margin, currentY);
        currentY += doc.heightOfString('No medicines data available.') + 5;
      }
      
    
    
      doc.end();
    }
    

    const sendPrescriptionPdf = (pdfData) => {
      const data = { name: patient.name };
      const emailSubject = `You have received a prescription receipt from ${clinic.clinic_name}`;

      sendEmail(
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
    };

    // const sendMedicinesPdf = (pdfData) => {
    //   const data = { name: patient.name };
    //   const emailSubject = `You have received a medicines report from ${clinic.clinic_name}`;

    //   sendEmail(
    //     patient.email,
    //     emailSubject,
    //     "sendrecipt.ejs",
    //     data,
    //     {
    //       filename: 'medicines_report.pdf',
    //       content: pdfData,
    //       contentType: 'application/pdf',
    //     }
    //   );
    // };

    // Create and send prescription PDF
// Create and send prescription PDF
const prescriptionDoc = new PDFDocument({ size: 'A4' });
await createPdf(prescriptionDoc, {
  sections: [
    {
      title: 'Prescription Details',
      items: [
        { text: `Provisional Diagnosis: ${prescription.provisional_diagnosis}`, styles: {} },
        { text: `Advice: ${prescription.advice}`, styles: {} },
        { text: `Clinical Notes: ${prescription.clinical_notes}`, styles: {} },
        { text: `Observation: ${prescription.observation}`, styles: {} },
        { text: `Investigation with Reports: ${prescription.investigation_with_repo}`, styles: {} },
      ]
    }
  ],
  callback: sendPrescriptionPdf
});

// Create and send medicines PDF
// const medicinesDoc = new PDFDocument({ size: 'A4' });
// await createPdf(medicinesDoc, {
//   sections: [
//     {
//       title: 'Medicines Details',
//       items: medicines.map(medicine => ({
//         text: `- Name: ${medicine.name}, Dosage: ${medicine.dosage}, Morning: ${medicine.timings.morning ? 'Yes' : 'No'}, Afternoon: ${medicine.timings.afternoon ? 'Yes' : 'No'}, Evening: ${medicine.timings.evening ? 'Yes' : 'No'}, Before Food: ${medicine.timings.beforeFood ? 'Yes' : 'No'}, After Food: ${medicine.timings.afterFood ? 'Yes' : 'No'}`,
//         styles: {}
//       }))
//     }
//   ],
//   callback: sendMedicinesPdf
// });


    res.status(200).json({ success: true, message: "Prescription and medicines added successfully", patient });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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

    if (appointmentDate.isBefore(currentDate, 'day') || appointmentDate.diff(currentDate, 'days') > 30) {
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    const { report_name,date } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const PatientModel = tenantDBConnection.model('Patient',Patient.schema);
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      return res.status(404).json({ error:  errormesaages[1021], errorcode: 1021 });
    }
    const originalFilename = `${patient.name}_${report_name}_${date}`;
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

    // Step 1: Find patients with follow-ups in the next three days
    const patientsWithFollowUps = await PatientModel.find({
      'appointment_history': {
        $elemMatch: {
          follow_up_from: { $exists: true, $ne: null },
          appointment_date: { $in: [todayString, tomorrowString, dayAfterTomorrowString] }
        }
      }
    });

    console.log('Found patients with follow-ups:', patientsWithFollowUps.length);

    const mobileNumbers = patientsWithFollowUps.map(patient => patient.mobile_number);

    const relatedPatients = await PatientModel.find({
      $or: [
        { mobile_number: { $in: mobileNumbers } },
        { bond: "myself" }
      ]
    });

    const followUpList = patientsWithFollowUps.map(followUpPatient => {
      const relatedPatientData = relatedPatients.filter(patient => 
        patient.mobile_number === followUpPatient.mobile_number || 
        patient.bond === "myself"
      );

      const filteredAppointments = followUpPatient.appointment_history.filter(appointment =>
        [todayString, tomorrowString, dayAfterTomorrowString].includes(appointment.appointment_date) &&
        appointment.follow_up_from
      );

      return {
        ...followUpPatient.toObject(),
        relatedPatients: relatedPatientData.map(patient => patient.toObject()), 
        appointment_history: filteredAppointments
      };
    });

    res.status(200).json({ success: true, followUpList });
  } catch (error) {
    console.error('Error in getFollowUpList:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createPdf = async (doc, content, clinic, doctors, template, appointment, patient, medicines, styles = {}) => {
  const buffers = [];
  // doc.on('data', buffers.push.bind(buffers));
  // doc.on('end', async () => {
  //   const pdfData = Buffer.concat(buffers);
  //   content.callback(pdfData);
  // });
console.log("appointment",appointment)
  const defaultStyles = {
    margin: 20,
    fontSize: 10,
    fontColor: 'black',
    font: "Helvetica"
  };
  const appliedStyles = { ...defaultStyles, ...styles };

  doc.margin = appliedStyles.margin;

  const getStyles = (section, name) => {
    const field = template.dynamicFields.find(
      (field) => field.section === section && field.name === name
    );
    return field ? field.styles : {};
  };

  const dynamicAddressField = template.dynamicFields.find(
    (field) => field.section === 'clinicDetails' && field.name === 'Address'
  );
  const clinicAddress = dynamicAddressField && dynamicAddressField.value ? dynamicAddressField.value : "";
  console.log("clinicAddress", clinicAddress);

  const applyStyles = (doc, fieldStyles) => {
    doc.font("Helvetica")
      .fontSize(parseInt(fieldStyles.size) || appliedStyles.fontSize)
      .fillColor(fieldStyles.color || appliedStyles.fontColor);
  };

  let logoHeight = 0;
  let logoTopY = appliedStyles.margin;
  if (template.logo) {
    try {
      const imageUrl = template.logo;
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');

      const availableWidth = doc.page.width * 0.10; // Reduced width
      const img = doc.openImage(imageBuffer);
      const scalingFactor = availableWidth / img.width;
      const finalWidth = img.width * scalingFactor;
      logoHeight = img.height * scalingFactor;

      // Define the circular clipping path
      const circleRadius = finalWidth / 2;
      const centerX = appliedStyles.margin + circleRadius;
      const centerY = logoTopY + circleRadius;

      // Clip to a circle
      doc.save()
        .translate(centerX, centerY)
        .circle(0, 0, circleRadius)
        .clip()
        .image(imageBuffer, -circleRadius, -circleRadius, {
          width: finalWidth,
          height: logoHeight,
        })
        .restore();

    } catch (error) {
      console.error('Error loading logo image:', error);
    }
  }

  const clinicDetailsX = appliedStyles.margin + 100;
  const doctorDetailsX = doc.page.width - appliedStyles.margin - 200;
  const maxWidthBeforeMidLine = (doc.page.width / 2) - clinicDetailsX - 10;

  let currentY = logoTopY;

  applyStyles(doc, getStyles('clinicDetails', 'Clinic Name'));
  doc.text(clinic.clinic_name, clinicDetailsX, currentY, {
    width: maxWidthBeforeMidLine,
    ellipsis: true
  });
  currentY += doc.heightOfString(clinic.clinic_name, { width: maxWidthBeforeMidLine }) + 5;

  applyStyles(doc, getStyles('clinicDetails', 'Contact number'));
  doc.text(clinic.mobile_number, clinicDetailsX, currentY, {
    width: maxWidthBeforeMidLine,
    ellipsis: true
  });
  currentY += doc.heightOfString(clinic.mobile_number, { width: maxWidthBeforeMidLine }) + 5;

  applyStyles(doc, getStyles('clinicDetails', 'Address'));
  doc.text(clinicAddress, clinicDetailsX, currentY, {
    width: maxWidthBeforeMidLine,
    ellipsis: true
  });
  currentY += doc.heightOfString(clinicAddress, { width: maxWidthBeforeMidLine }) + 5;

  const verticalLineX = (clinicDetailsX + (doc.page.width - appliedStyles.margin - 100)) / 2;
  const verticalLineEndY = currentY + 20; 
  doc.moveTo(verticalLineX, logoTopY)
    .lineTo(verticalLineX, verticalLineEndY)
    .lineWidth(0.5)
    .stroke();

  currentY = logoTopY; // Align with the top of the logo
  applyStyles(doc, getStyles('doctorDetails', 'Doctor Name'));
  doc.text(` ${doctors.name}`, doctorDetailsX, currentY, { align: 'right' });
  currentY += doc.heightOfString(doctors.name) + 5;

  applyStyles(doc, getStyles('doctorDetails', 'Speciality'));
  doc.text(` ${doctors.specialist}`, doctorDetailsX, currentY, { align: 'right' });
  currentY += doc.heightOfString(doctors.specialist) + 5;

  const pgQualification = Array.isArray(doctors.pg_qualification) 
    ? doctors.pg_qualification.join(', ') 
    : doctors.pg_qualification || '';

  const ugQualification = doctors.ug_qualification || '';
  const qualifications = [ugQualification, pgQualification].filter(Boolean).join(', ');

  applyStyles(doc, getStyles('doctorDetails', 'Degree'));
  doc.text(` ${qualifications}`, doctorDetailsX, currentY, { align: 'right' });
  currentY += doc.heightOfString(qualifications || "MBBS") + 5;

  // First Horizontal Line
  currentY += 10;
  doc.moveTo(appliedStyles.margin, currentY)
    .lineTo(doc.page.width - appliedStyles.margin, currentY)
    .lineWidth(0.5)
    .stroke();

  currentY += 20;

  // Patient Details
  applyStyles(doc, getStyles('patientDetails', 'Patient Name'));
  doc.text(`Patient Name: ${patient.name}`, appliedStyles.margin, currentY, { continued: true });
  doc.text(`                                          `, { continued: true });
  applyStyles(doc, getStyles('patientDetails', 'Age'));
  doc.text(`Age: ${patient.age}`, { continued: true });
  doc.text(`                  `, { continued: true });
  applyStyles(doc, getStyles('patientDetails', 'Gender'));
  doc.text(`Gender: ${patient.gender}`, { continued: true });
  doc.text(`                 `, { continued: true });


  currentY += 20;
  doc.moveTo(appliedStyles.margin, currentY)
    .lineTo(doc.page.width - appliedStyles.margin, currentY)
    .lineWidth(0.5)
    .stroke();
    currentY += 20;
    
    if (appointment.prescription && appointment.prescription.date) {
      const formattedDate = appointment.prescription.date // Format the date from appointment.prescription
      applyStyles(doc, getStyles('prescriptionDetails', 'Date'));
    
      // Print the date right-aligned
      doc.text(`Date: ${formattedDate}`, appliedStyles.margin, currentY, {
        align: 'right',
        width: doc.page.width - 2 * appliedStyles.margin, // Set the width to align properly
      });
    
      // Move to the next line
      currentY += doc.heightOfString(`Date: ${formattedDate}`) + 10; // Add gap after date
    }
    

  
    if (appointment.prescription) {
      applyStyles(doc, getStyles('prescriptionDetails', 'Prescription Details'));
      doc.text('Prescription Details', appliedStyles.margin, currentY,{ underline: true });
      currentY += 35; 
    
      const prescriptionFields = appointment.prescription
      const keys = Object.keys(prescriptionFields)
        .filter(key => !key.startsWith('$') && key !== '_id' && key !== 'date'); 
    
      keys.forEach((key) => {
        const fieldValue = prescriptionFields[key]; 
        const fieldLabel = key.replace(/_/g, ' '); 
    
        const fieldStyle = getStyles('prescriptionDetails', key);
        applyStyles(doc, fieldStyle);
    
        const displayValue = fieldValue !== null && fieldValue !== undefined ? fieldValue : 'N/A';
        
        doc.text(`${fieldLabel}:`, appliedStyles.margin, currentY);
        currentY += doc.heightOfString(`${fieldLabel}:`) + 5; 
        doc.text(displayValue, appliedStyles.margin + 80, currentY); 
    
        currentY += doc.heightOfString(displayValue) + 5;
      });
    } else {
      applyStyles(doc, getStyles('prescriptionDetails', 'No Prescription Data'));
      doc.text('No prescription data available.', appliedStyles.margin, currentY);
      currentY += doc.heightOfString('No prescription data available.') + 5;
    }
    
    console.log(appointment.medicines)
    
    if (appointment.medicines && appointment.medicines.length > 0) {
      currentY += 20;
      applyStyles(doc, getStyles('medicines', 'Medicine Details'));
      doc.text('Medicines Details', appliedStyles.margin, currentY, { underline: true });
      currentY += doc.heightOfString('Medicines Details') + 10;
    
      // Define the table headers
      applyStyles(doc, getStyles('medicines', 'Headers'));
      const margin = appliedStyles.margin;
      const columnWidth = 100; 
      const columnSpacing = 10; 
    
      doc.text('S.No', margin, currentY);
      doc.text('Medicine Name', margin + columnWidth*0.5, currentY);
      doc.text('Dosage', margin + columnWidth * 2, currentY);
      doc.text('Timings', margin + columnWidth * 2.5, currentY);
      doc.text('When to Consume', margin + columnWidth * 4, currentY);
    
      currentY += doc.heightOfString('Headers') + 5; // Adjust for subheaders
    
      // Loop through medicines to populate table rows
      appointment.medicines.forEach((medicine, index) => {
        let timings = [];
        let whenConsume = [];
    
        if (medicine.timings.morning) {
          timings.push('Morning');
        }
        if (medicine.timings.afternoon) {
          timings.push('Afternoon');
        }
        if (medicine.timings.evening) {
          timings.push('Evening');
        }
    
        // Populate the When to Consume array based on true values
        if (medicine.timings.beforeFood) {
          whenConsume.push('Before Food');
        }
        if (medicine.timings.afterFood) {
          whenConsume.push('After Food');
        }
    
        // Medicine details
        applyStyles(doc, getStyles('medicines', 'Row'));
        doc.text(`${index + 1}`, margin, currentY);
        doc.text(medicine.name, margin + columnWidth*0.5, currentY);
        doc.text(medicine.dosage, margin + columnWidth * 2, currentY);
    
        const timingsText = timings.length > 0 ? timings.join(', ') : 'None';
        doc.text(timingsText, margin + columnWidth * 2.5, currentY);
    
        const whenConsumeText = whenConsume.length > 0 ? whenConsume.join(', ') : 'None';
        console.log('When to Consume:', whenConsumeText);
        doc.text(whenConsumeText, margin + columnWidth * 4, currentY);
    
        currentY += doc.heightOfString('M') + 10; 
      });
    
      doc.moveDown(); 
    } else {
      applyStyles(doc, getStyles('medicines', 'No Medicines Data'));
      doc.text('No medicines data available.', appliedStyles.margin, currentY);
      currentY += doc.heightOfString('No medicines data available.') + 5;
    }
    
    


  doc.end();
};

const fs = require('fs');
const path = require('path');

const downloadpdf = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, appointmentId } = req.params;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found', errorcode: 1021 });
    }

    const appointment = patient.appointment_history.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', errorcode: 1028 });
    }

    const clinic = await Clinic.findOne({ _id: req.user._id }).exec();
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found', errorcode: 1030 });
    }

    const doctors = await doctor.findById(appointment.doctor).exec();
    if (!doctors) {
      return res.status(404).json({ success: false, error: 'Doctor not found', errorcode: 1031 });
    }

    const template = await Template.findOne({ clinic_id: req.user._id });
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found', errorcode: 1032 });
    }
    const content = {};
    const tempDir = path.join(__dirname, 'temp');
    const tempFilePath = path.join(tempDir, 'Prescription.pdf');

    // // Ensure the temp directory exists
    // if (!fs.existsSync(tempDir)) {
    //   fs.mkdirSync(tempDir);
    // }

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(tempFilePath);

    doc.pipe(writeStream);

    createPdf(doc,content, clinic, doctors, template, appointment, patient);

    writeStream.on('finish', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Prescription.pdf"');

      const readStream = fs.createReadStream(tempFilePath);
      readStream.pipe(res);

      readStream.on('end', () => {
        fs.unlink(tempFilePath, (err) => {
          if (err) {
            console.error('Error deleting temporary file:', err);
          }
        });
      });

      readStream.on('error', (err) => {
        console.error('Error sending file:', err);
        res.status(500).json({ success: false, error: 'Error sending file', errorcode: 1051 });
      });
    });

    writeStream.on('error', (err) => {
      console.error('Error writing PDF file:', err);
      res.status(500).json({ success: false, error: 'Error creating PDF file', errorcode: 1052 });
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ success: false, error: 'Internal server error', errorcode: 1050 });
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
  resendOtp,
  downloadpdf
}
