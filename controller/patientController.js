const { default: mongoose } = require("mongoose");
const Patient = require("../modal/patient");

const addPatient = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
console.log(req.body)
    const patient = await PatientModel.create(req.body);

    res.status(201).json({ success: true, message: "Patient added successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const { tenantDBConnection } = req;

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const mainDBConnection = mongoose.connection; 

    const patients = await PatientModel.find().populate({
      path: 'doctor',
      model: mainDBConnection.model('doctor')  
    });

    res.json({ success: true, message: "Patients fetched successfully", patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const getPatients = async (req, res) => {
  try {
    const { tenantDBConnection } = req;

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const mainDBConnection = mongoose.connection; 

    const patients = await PatientModel.find({doctor:req.body.doctorId}).populate({
      path: 'doctor',
      model: mainDBConnection.model('doctor')  
    });

    res.json({ success: true, message: "Patients fetched successfully", patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const getPatientById = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const mainDBConnection = mongoose.connection; 

    const patient = await PatientModel.findById(req.params.id).populate({
      path: 'docter',
      model: mainDBConnection.model('doctor')
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found", errorcode: 1005 });
    }

    res.json({ success: true, message: "Patient fetched successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patient = await PatientModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate({
      path: 'doctor',
      model: mongoose.connection.model('doctor')
    });

    if (!patient) {
      return res.status(400).json({ error: "Patient not found", errorcode: 1005 });
    }

    res.status(200).json({ success: true, message: "Patient updated successfully", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patient = await PatientModel.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(400).json({ error: errormesaages[1005], errorcode: 1005 });
    }
    res.json({ success: true, message: "Patient deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const sendPatientOtp = async (req, res) => {
  const { mobile_number } = req.body;
  const otp = "1234"; 
  
  try {
    const { tenantDBConnection } = req;
    
    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
  const patients=  await PatientModel.findOneAndUpdate(
      { mobile_number },
      { otp },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );



    res.status(200).json({ message: 'OTP sent successfully',patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

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

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = { 
                   addPatient, 
                   getAllPatients, 
                   getPatientById, 
                   updatePatient, 
                   deletePatient ,
                   getPatients,
                   sendPatientOtp,
                   verifyPatientOtp
                  };
