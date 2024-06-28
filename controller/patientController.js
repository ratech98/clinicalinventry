const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Patient = require('../modal/patient');

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
    const { mobile_number } = req.query;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const mainDBConnection = mongoose.connection;
    let query = {};
    if (mobile_number) {
      query.mobile_number = { $regex: mobile_number, $options: 'i' };
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
      return res.status(404).json({ error: "Patient not found", errorcode: 1005 });
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
    const { appointment_date, time, reason, doctor, updateAppointmentId } = req.body;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findById(id);
    if (!patient) {
      return res.status(400).json({ error: "Patient not found", errorcode: 1005 });
    }
    if (updateAppointmentId) {
      const appointmentIndex = patient.appointment_history.findIndex(
        (appointment) => appointment._id.toString() === updateAppointmentId
      );
      if (appointmentIndex !== -1) {
        patient.appointment_history[appointmentIndex].appointment_date = appointment_date;
        patient.appointment_history[appointmentIndex].time = time;
        patient.appointment_history[appointmentIndex].reason = reason;
        patient.appointment_history[appointmentIndex].doctor = doctor;
      } else {
        return res.status(404).json({ error: "Appointment not found", errorcode: 1006 });
      }
    } else {
      patient.appointment_history.push({ appointment_date, time, reason, doctor });
    }
    await patient.save();
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
      return res.status(400).json({ error: "Patient not found", errorcode: 1005 });
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
    const { tenantDBConnection } = req;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findOne({ mobile_number });
    if (!patient) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (otp !== patient.otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    patient.otpVerified = true;
    await patient.save();
    res.status(200).json({ success: true, message: 'OTP verified successfully', patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update Appointment with Prescription
const updateAppointmentWithPrescription = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, appointmentId, prescription } = req.body;
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found", errorcode: 1005 });
    }
    const appointment = patient.appointment_history.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found", errorcode: 1006 });
    }
    appointment.prescription = prescription;
    await patient.save();
    res.status(200).json({ success: true, message: "Prescription added successfully", patient });
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
      return res.status(404).json({ error: "Patient not found", errorcode: 1005 });
    }
    const appointment = patient.appointment_history.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found", errorcode: 1006 });
    }
    res.status(200).json({ success: true, message: "Prescription fetched successfully", prescription: appointment.prescription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
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
  getPrescription
};
