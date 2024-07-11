const { errormesaages } = require("../errormessages");
const Availability = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const doctor = require("../modal/doctor");
const { Storage } = require("@google-cloud/storage");
const Template = require("../modal/prescriptiontemplate");

require("dotenv").config();
const bucketName = process.env.bucketName;
const gcsStorage = new Storage();


// const bucketName = process.env.BUCKET_NAME;
// const gcsStorage = new Storage();

const addClinic = async (req, res) => {
  try {
    const clinic = await Clinic.create(req.body);
    console.log(req.body);
    res.status(200).json({ success: true, message: "Clinic added successfully", clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllClinics = async (req, res) => {
  try {
    const {adminVerified}=req?.query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filter = { };
if(adminVerified){
  filter.adminVerified=adminVerified
}
    const totalClinics = await Clinic.countDocuments(filter);
    const totalPages = Math.ceil(totalClinics / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const clinics = await Clinic.find(filter).skip(startIndex).limit(limit);

    res.json({
      success: true,
      message: "Clinics fetched successfully",
      totalCount: totalClinics,
      page,
      limit,
      totalPages,
      startIndex: startIndex + 1,
      endIndex: endIndex > totalClinics ? totalClinics : endIndex,
      currentPage: page,
      clinics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




const getClinicById = async (req, res) => {
  try {

    const id=req.user._id
    console.log("id",id)
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return res.status(404).json({ error:errormesaages[1001],errorcode:1001 });
    }
    res.json({ success: true, message: "Clinic fetched successfully", clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getClinicId = async (req, res) => {
  try {
     const clinic = await Clinic.findById(req?.params.id);
    if (!clinic) {
      return res.status(404).json({ error:errormesaages[1001],errorcode:1001 });
    }
    res.json({ success: true, message: "Clinic fetched successfully", clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateClinic = async (req, res) => {
  try {

    const originalFilename = req.file.originalname;
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.]/g, '_');
    const imagePath = `clinic_certificates/${Date.now()}_${sanitizedFilename}`;
    await gcsStorage.bucket(bucketName).file(imagePath).save(req.file.buffer);
   req.body.certificate=`https://storage.googleapis.com/${bucketName}/${imagePath}`

    const clinic = await Clinic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!clinic) {
      return res.status(400).json({ error:errormesaages[1001],errorcode:1001  });
    }
    res.status(200).json({ success: true, message: "Clinic updated successfully", clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteClinic = async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndDelete(req.params.id);
    if (!clinic) {
      return res.status(400).json({ error:errormesaages[1001],errorcode:1001  });
    }
    res.json({ success: true, message: "Clinic deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const verify_clinic=async (req, res) => {
  try {
    const clinic = await Clinic.findOneAndUpdate(
      { _id: req.params.id },
      { adminVerified: true },
      { new: true }
    );
    if (clinic) {
      var newTemplate = new Template({
        clinic_id: clinic._id,
        logo: '',
        dynamicFields: []  
      })}
      await newTemplate.save();
    res.status(200).json({ success: true, message: 'Admin verified successfully', clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
}


const verify_clinic_certificate=async (req, res) => {
  try {
    const clinic = await Clinic.findOneAndUpdate(
      { _id: req.params.id },
      req?.body ,
      { new: true }
    );
    res.status(200).json({ success: true, message: 'certificate verified successfully', clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


const getDoctorsAndAvailabilityByClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialist, recently_joined, onleave, page = 1, limit = 10, verify } = req.query;

    // Get today's date in UTC format (YYYY-MM-DD)
    const todayUTC = new Date().toISOString().split('T')[0]; // Outputs 'YYYY-MM-DD'
console.log( new Date(todayUTC))
    // Query for fetching doctors
    const doctorQuery = { 'clinics.clinicId': id };
    if (specialist) {
      doctorQuery.specialist = specialist;
    }
    if (recently_joined) {
      doctorQuery["clinics.verified"] = false;
    }
    if (verify) {
      doctorQuery["clinics.verified"] = true;
    }

    // Fetch total count of doctors matching the query
    const totalDoctors = await doctor.countDocuments(doctorQuery);
    const totalPages = Math.ceil(totalDoctors / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Fetch doctors based on query criteria
    const doctors = await doctor.find(doctorQuery)
      .limit(limit)
      .skip(startIndex);

    if (!doctors.length) {
      return res.status(404).json({ success: false, error: 'No doctors found for this clinic' });
    }

    // Fetch availability for each doctor
    const doctorAvailabilityPromises = doctors.map(async (doctor) => {
      const availabilityDoc = await Availability.findOne({
        doctorId: doctor._id,
        'availabilities.date': { $lte: new Date(todayUTC) }, // Compare with today's UTC date
        clinicId: id
      });
console.log(availabilityDoc)
      let availabilityStatus = 'unavailable';
      if (availabilityDoc) {
        const todayAvailability = availabilityDoc.availabilities.find(avail => avail.date.toISOString().split('T')[0] === todayUTC);
        if (todayAvailability) {
          // Check if any slot for today is available
          const availableSlots = todayAvailability.slots.some(slot => slot.available);
          availabilityStatus = availableSlots ? 'available' : 'unavailable';
        }
      }

      return {
        doctor,
        availability: availabilityStatus
      };
    });

    // Resolve all availability promises
    const doctorAvailability = await Promise.all(doctorAvailabilityPromises);

    // Filter doctors based on 'onleave' query parameter
    let filteredDoctorAvailability = doctorAvailability;
    if (onleave) {
      filteredDoctorAvailability = doctorAvailability.filter(doc => doc.availability === 'unavailable');
    }

    // Calculate counts of available and unavailable doctors
    const availableDoctorsCount = filteredDoctorAvailability.filter(doc => doc.availability === 'available').length;
    const unavailableDoctorsCount = filteredDoctorAvailability.filter(doc => doc.availability === 'unavailable').length;

    // Respond with the fetched data
    res.status(200).json({
      success: true,
      message: 'Doctors fetched successfully',
      totalDoctorsCount: totalDoctors,
      availableDoctorsCount,
      unavailableDoctorsCount,
      totalCount: totalDoctors,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      startIndex: startIndex + 1,
      endIndex: endIndex > totalDoctors ? totalDoctors : endIndex,
      currentPage: parseInt(page),
      doctorAvailability: filteredDoctorAvailability,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};






const blockOrUnblockClinic = async (req, res) => {
  const { id } = req.params;
  const { block, reason } = req.body;

  try {
    let clinic;
    if (block) {
      clinic = await Clinic.findByIdAndUpdate(id, { block: true, block_reason: reason }, { new: true });
    } else {
      clinic = await Clinic.findByIdAndUpdate(id, { block: false, unblock_reason: reason }, { new: true });
    }

    if (!clinic) {
      return res.status(404).json({ success:false,error: 'Clinic not found' });
    }

    const action = block ? 'blocked' : 'unblocked';
    res.json({ success: true, message: `Clinic ${action} successfully`, clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { addClinic,
                   getAllClinics, 
                   getClinicById, 
                   updateClinic, 
                   deleteClinic ,
                   verify_clinic,
                   getDoctorsAndAvailabilityByClinic,
                   blockOrUnblockClinic,
                   verify_clinic_certificate,
                   getClinicId
                  };
