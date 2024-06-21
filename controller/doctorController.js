
const { errormesaages } = require("../errormessages");
const { Availability } = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const doctor = require("../modal/doctor");

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
    const doctors = await doctor.find().populate('clinic');
    res.json({ success: true, message: "Doctors fetched successfully", doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getClinicDetailsByDoctorId = async (req, res) => {
try {
    const doctors = await doctor.findById(req.body.doctorId).populate('clinic');
    if (!doctors) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const clinics = doctors.clinic;
    res.status(200).json({ success: true, message: 'Clinic details fetched successfully', clinics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctors = await doctor.findById(req.params.id).populate('clinic');
    if (!doctors) {
      return res.status(404).json({ error:  errormesaages[1002], errorcode: 1002 });
    }
    res.json({ success: true, message: "Doctor fetched successfully", doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDoctor = async (req, res) => {
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
const updateDoctorAvailabilitty = async (req, res) => {
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
const updateDoctorVerify = async (req, res) => {
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

    res.status(200).json({ message: 'Clinic added to doctor successfully', doctors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addAvailability = async (req, res) => {
  const { doctorId, clinicId, date, startTime, endTime } = req.body;

  try {
    const doctors = await doctor.findById(doctorId);
    if (!doctors) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const availability = new Availability({
      doctor: doctorId,
      clinic: clinicId,
      date,
      startTime,
      endTime
    });

    await availability.save();

    doctors.availability.push(availability._id);
    clinic.availability.push(availability._id);
    await doctors.save();
    await clinic.save();

    res.status(201).json({ message: 'Availability added successfully', availability });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAvailability = async (req, res) => {

  const { date, startTime, endTime,id } = req.body;

  try {
    const availability = await Availability.findById(id);
    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    if (date) availability.date = date;
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;

    await availability.save();

    res.status(200).json({ message: 'Availability updated successfully', availability });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = { 
                addDoctor, 
                getAllDoctors, 
                getDoctorById,
                 updateDoctor, 
                 deleteDoctor ,
                updateDoctorAvailabilitty,
                updateDoctorVerify,
                addClinicToDoctor,
                addAvailability,
                updateAvailability,
                getClinicDetailsByDoctorId
                };
