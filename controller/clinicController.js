const { errormesaages } = require("../errormessages");
const Availability = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const doctor = require("../modal/doctor");
const { Storage } = require("@google-cloud/storage");
const Template = require("../modal/prescriptiontemplate");
const moment = require('moment');
const { createNotification } = require("../lib/notification");


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
    let updateData = { ...req.body }; 
    console.log(req.body.email)
    if (req.body.email) {
      const emailExists = await Clinic.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({ success:false,error:errormesaages[1025],errorcode:1025});
      }
    }
    if (req.files) {
      const files = req.files;
      const uploadedFiles = {};

      for (const fieldName in files) {
        if (Object.hasOwnProperty.call(files, fieldName)) {
          const file = files[fieldName][0];
          const sanitizedFilename = file.originalname.replace(/\s+/g, '_');
          const imagePath = `docter_certificates/${Date.now()}_${sanitizedFilename}`;

          await gcsStorage.bucket(bucketName).file(imagePath).save(file.buffer);
          uploadedFiles[fieldName] = `https://storage.googleapis.com/${bucketName}/${imagePath}`;
        }
      }

      updateData = { ...updateData, ...uploadedFiles };
    }

    const clinic = await Clinic.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!clinic) {
      return res.status(400).json({success:false, error:errormesaages[1001],errorcode:1001});
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
      return res.status(400).json({success:false, error:errormesaages[1001],errorcode:1001  });
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
      createNotification("clinic",req.params.id,"clinic verified by admin successfully")
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
    createNotification("clinic",req.params.id,"clinic certificate verified by admin successfully")

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

    const todayUTC = new Date().toISOString().split('T')[0]; // Outputs 'YYYY-MM-DD'
console.log( new Date(todayUTC))
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

    const totalDoctors = await doctor.countDocuments(doctorQuery);
    const totalPages = Math.ceil(totalDoctors / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const doctors = await doctor.find(doctorQuery)
      .limit(limit)
      .skip(startIndex);

    if (!doctors.length) {
      return res.status(404).json({ success: false, error: errormesaages[1027],errorcode:1027});
    }

    const doctorAvailabilityPromises = doctors.map(async (doctor) => {
      const availabilityDoc = await Availability.findOne({
        doctorId: doctor._id,
        'availabilities.date': { $lte: new Date(todayUTC) },
        clinicId: id
      });
console.log(availabilityDoc)
      let availabilityStatus = 'unavailable';
      if (availabilityDoc) {
        const todayAvailability = availabilityDoc.availabilities.find(avail => avail.date.toISOString().split('T')[0] === todayUTC);
        if (todayAvailability) {
          const availableSlots = todayAvailability.slots.some(slot => slot.available);
          availabilityStatus = availableSlots ? 'available' : 'unavailable';
        }
      }

      return {
        doctor,
        availability: availabilityStatus
      };
    });

    const doctorAvailability = await Promise.all(doctorAvailabilityPromises);

    let filteredDoctorAvailability = doctorAvailability;
    if (onleave) {
      filteredDoctorAvailability = doctorAvailability.filter(doc => doc.availability === 'unavailable');
    }

    const availableDoctorsCount = filteredDoctorAvailability.filter(doc => doc.availability === 'available').length;
    const unavailableDoctorsCount = filteredDoctorAvailability.filter(doc => doc.availability === 'unavailable').length;

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
      return res.status(404).json({ success:false,error:errormesaages[1001],errorcode:1001 });
    }

    const action = block ? 'blocked' : 'unblocked';
    createNotification("clinic",id,`clinic ${action} by admin for ${reason}, contact admin !`)

    res.json({ success: true, message: `Clinic ${action} successfully`, clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const update_Subscription=async (req, res) => {
  try {
    const { subscription, subscription_startdate, subscription_enddate } = req.body;
    const clinicId = req.params.id;

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).send({success:false,error:errormesaages[1001],errorcode:1001});
    }

    clinic.subscription = subscription;
    clinic.subscription_startdate = subscription_startdate
    clinic.subscription_enddate = subscription_enddate

    await clinic.save();

    res.status(200).send({success:true,message:'Subscription details updated successfully',clinic});
  } catch (error) {
    console.error('Error updating subscription details:', error);
    res.status(500).send({success:false,error:error});
  }
}

const getsubscriptiondays=async (req, res) => {
  try {
    const clinicId = req.params.id;

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).send({success:false,error:errormesaages[1001],errorcode:1001});
    }

    if (!clinic.subscription_enddate) {
      return res.status(400).send({success:false,error:errormesaages[1026],errorcode:1026});
    }

    const currentDate = moment();
    const endDate = moment(clinic.subscription_enddate);
    const remainingDays = endDate.diff(currentDate, 'days');

    res.status(200).json({ remainingDays });
  } catch (error) {
    console.error('Error calculating remaining days:', error);
    res.status(500).send({success:false,error:error});
  }
}

module.exports = { addClinic,
                   getAllClinics, 
                   getClinicById, 
                   updateClinic, 
                   deleteClinic ,
                   verify_clinic,
                   getDoctorsAndAvailabilityByClinic,
                   blockOrUnblockClinic,
                   verify_clinic_certificate,
                   getClinicId,
                   update_Subscription,
                   getsubscriptiondays
                  };
