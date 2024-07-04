const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Patient = require('../modal/patient');
const { Storage } = require("@google-cloud/storage");

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
    const { mobile_number,appointment_date } = req.query;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const mainDBConnection = mongoose.connection;
    let query = {};
    if (mobile_number) {
      query.mobile_number = { $regex: mobile_number, $options: 'i' };
    }

    if (appointment_date) {
      query['appointment_history.appointment_date'] = appointment_date;
    }
    const patients = await PatientModel.find(query).populate({
      path: 'appointment_history.doctor',
      model: mainDBConnection.model('doctor')
    });
    res.json({ success: true, message: "Patients fetched successfully", patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get Patients by Doctor ID
const getPatients = async (req, res) => {
  try {
    
    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const mainDBConnection = mongoose.connection;
    const patients = await PatientModel.find({ 'appointment_history.doctor': req.body.doctorId }).populate({
      path: 'appointment_history.doctor',
      model: mainDBConnection.model('doctor')
    });
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
      return res.status(404).json({success:false, error: "Patient not found", errorcode: 1005 });
    }
    const totalVisits = patient.appointment_history.length;
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
    
    // Find the patient by ID and update the fields from req.body
    const patient = await PatientModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!patient) {
      return res.status(404).json({success:false, error: "Patient not found", errorcode: 1005 });
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
      return res.status(400).json({success:false, error: "Patient not found", errorcode: 1005 });
    }
    res.json({ success: true, message: "Patient deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Send Patient OTP
const sendPatientOtp = async (req, res) => {
  const { mobile_number } = req.body;
  const otp = "1234"; 
  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    }
    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findOneAndUpdate(
      { mobile_number },
      { otp },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, message: 'OTP sent successfully', patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Verify Patient OTP
const verifyPatientOtp = async (req, res) => {
  const { mobile_number, otp } = req.body;
  try {
    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    }
    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findOne({ mobile_number });
    if (!patient) {
      return res.status(404).json({success:false, error: 'User not found' });
    }
    if (otp !== patient.otp) {
      return res.status(400).json({success:false, error: 'Invalid OTP' });
    }
    patient.otpVerified = true;
    await patient.save();
    res.status(200).json({ success: true, message: 'OTP verified successfully', patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateAppointmentWithPrescription = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, appointmentId, prescription, medicines } = req.body;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    
    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({success:false, error: "Patient not found", errorcode: 1005 });
    }

    const appointment = patient.appointment_history.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found", errorcode: 1006 });
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
      return res.status(400).json({success:false, error: "Medicines should be an array", errorcode: 1007 });
    }

    appointment.prescription = prescription;
    await patient.save();

    res.status(200).json({ success: true, message: "Prescription and medicines added successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Get Prescription
const getPrescription = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, appointmentId } = req.body;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    
    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({success:false, error: "Patient not found", errorcode: 1005 });
    }

    const appointment = patient.appointment_history.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found", errorcode: 1006 });
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
    const { patientId, appointment_date, time, reason, doctorId, temp, Bp } = req.body;

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      return res.status(404).json({success:false, error: "Patient not found", errorcode: 1005 });
    }

    const tokenCount = patient.appointment_history.filter(a => a.appointment_date === appointment_date).length;
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

    // if (diagnose_reports && diagnose_reports.length > 0) {
    //   diagnose_reports.forEach(report => {
    //     patient.diagnose_reports.push({
    //       report_name: report.report_name,
    //       diagnose_report: report.diagnose_report
    //     });
    //   });
    // }

    await patient.save();

    res.status(200).json({ success: true, message: "Appointment and diagnose reports added successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addFollowUpAppointment = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, previousAppointmentId, appointment_date, time, reason, doctorId, temp, Bp } = req.body;

    const PatientModel = tenantDBConnection.model('Patient',Patient.schema);
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      return res.status(404).json({success:false, error: "Patient not found", errorcode: 1005 });
    }

    const previousAppointment = patient.appointment_history.id(previousAppointmentId);

    if (!previousAppointment) {
      return res.status(404).json({ error: "Previous appointment not found", errorcode: 1006 });
    }

    const tokenCount = patient.appointment_history.filter(a => a.appointment_date === appointment_date).length;
    const newTokenNumber = tokenCount + 1;

    const newAppointment = {
      appointment_date,
      time,
      reason,
      doctor: doctorId,
      token_number: newTokenNumber,
      follow_up_from: previousAppointmentId,
      temp,
      Bp
    };

    patient.appointment_history.push(newAppointment);
    await patient.save();

    res.status(201).json({ success: true, message: "Follow-up appointment added successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getPatientsWithTodayAppointments = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).split('/').join('-'); // Format as "DD-MM-YYYY"

    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patients = await PatientModel.aggregate([
      {
        $unwind: '$appointment_history' // Flatten the appointment_history array
      },
      {
        $match: {
          'appointment_history.appointment_date': today
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
      return res.status(404).json({ error: 'Patient not found', errorcode: 1005 });
    }

    const originalFilename = req.file.originalname;
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
      return res.status(404).json({success:false, error: 'Patient not found', errorcode: 1005 });
    }

    const diagnoseReports = patient.diagnose_reports;

    res.status(200).json({ success: true, diagnoseReports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

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
  get_diagnose_report
};
