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
    const { mobile_number } = req.query; // Get mobileNumber from query parameters

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);
    const mainDBConnection = mongoose.connection; 

    let query = {};
    if (mobile_number) {
      query.mobile_number = { $regex: mobile_number, $options: 'i' };
    }

    const patients = await PatientModel.find(query)

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



// const getPatientById = async (req, res) => {
//   try {
//     const { tenantDBConnection } = req;
    
//     const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

//     const mainDBConnection = mongoose.connection; 

//     const patient = await PatientModel.findById(req.params.id).populate({
//       path: 'docter',
//       model: mainDBConnection.model('doctor')
//     });

//     if (!patient) {
//       return res.status(404).json({ error: "Patient not found", errorcode: 1005 });
//     }

//     res.json({ success: true, message: "Patient fetched successfully", patient });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };
const updatePatient = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { id } = req.params;
    const { appointment_date, reason, doctor, updateAppointmentId } = req.body;

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patient = await PatientModel.findById(id);
    if (!patient) {
      return res.status(400).json({ error: "Patient not found", errorcode: 1005 });
    }

    let appointmentHistoryUpdate = {};
    if (updateAppointmentId) {
      // Find the appointment to update
      const appointmentIndex = patient.appointment_history.findIndex(
        (appointment) => appointment._id.toString() === updateAppointmentId
      );

      if (appointmentIndex !== -1) {
        // Update the existing appointment
        patient.appointment_history[appointmentIndex].appointment_date = appointment_date;
        patient.appointment_history[appointmentIndex].reason = reason;
        patient.appointment_history[appointmentIndex].doctor = doctor;
      } else {
        return res.status(404).json({ error: "Appointment not found", errorcode: 1006 });
      }
    } else {
      patient.appointment_history.push({
        appointment_date,
        reason,
        doctor: doctorId,
      });
    }

    // Save the updated patient record
    await patient.save();

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

const getPatientById = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { id } = req.params;
    const { viewall } = req.query; // Get the viewall query parameter

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const mainDBConnection = mongoose.connection;

    const patient = await PatientModel.findById(id).populate({
      path: 'appointment_history.doctor',
      model: mainDBConnection.model('doctor')
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found", errorcode: 1005 });
    }

    const totalVisits = patient.appointment_history.length; // Count total visits

    res.json({
      success: true,
      message: "Patient fetched successfully",
      totalVisits,
      appointment_history: viewall ? patient.appointment_history : patient.appointment_history.slice(0, 5), // Return full history if viewall is true
      patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const updateAppointmentWithPrescription = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, appointmentId } = req.body;
    const { prescription } = req.body;

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

const getPrescription = async (req, res) => {
  try {
    const { tenantDBConnection } = req;
    const { patientId, appointmentId } = req.body

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found", errorcode: 1005 });
    }

    const appointment = patient.appointment_history.id(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found", errorcode: 1006 });
    }

    const prescription = appointment.prescription;

    res.status(200).json({ success: true, message: "Prescription fetched successfully", prescription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const todayappointment = async (req, res) => {
  try {
    console.log("entry")
    const dd = String(new Date().getDate()).padStart(2, '0');
    console.log(dd)
    const mm = String(new Date().getMonth() + 1).padStart(2, '0'); 
    console.log(mm)
    const yyyy = new Date().getFullYear();
    console.log(yyyy)
    const formattedToday = `${dd}-${mm}-${yyyy}`;
console.log("formatted date",formattedToday)
    const { tenantDBConnection } = req;

    const PatientModel = tenantDBConnection.model('Patient', Patient.schema);

    const patients = await PatientModel.find({
      'appointment_history.appointment_date': formattedToday
    }).populate('appointment_history.doctor');
    

    res.json({ success: true, message: "Today's appointment patients fetched successfully", patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}








module.exports = { 
                   addPatient, 
                   getAllPatients, 
                   getPatientById, 
                   updatePatient, 
                   deletePatient ,
                   getPatients,
                   sendPatientOtp,
                   verifyPatientOtp,
                   updateAppointmentWithPrescription,
                   getPrescription,
                   todayappointment
                  };
