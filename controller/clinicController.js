const { errormesaages } = require("../errormessages");
const Availability = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const doctor = require("../modal/doctor");
const { Storage } = require("@google-cloud/storage");
const Template = require("../modal/prescriptiontemplate");
const moment = require('moment');
const { createNotification } = require("../lib/notification");
const { SubscriptionDuration, freetrail } = require("../modal/subscription");
const Receptionist = require("../modal/receptionist");


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
    res.status(500).json({ error: error.message });
  }
};

const getAllClinics = async (req, res) => {
  try {
    const { adminVerified, pendingDue } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filter = {};
    if (adminVerified) {
      filter.adminVerified = adminVerified;
    }

    let clinics = await Clinic.find(filter)
      .populate({
        path: 'subscription_details.subscription_id',
        populate: {
          path: 'title'
        }
      });

    clinics = await Promise.all(
      clinics.map(async (clinic) => {
        const currentDate = moment();
        let remainingDays = 0;
        let remainingHours = 0;

if (clinic.subscription_details && clinic.subscription_details.length > 0) {
  const lastSubscriptionDetail = clinic.subscription_details[clinic.subscription_details.length - 1];
  
  const startDate = moment(lastSubscriptionDetail.subscription_startdate, 'DD-MM-YYYY HH:mm:ss');
  const endDate = moment(lastSubscriptionDetail.subscription_enddate, 'DD-MM-YYYY HH:mm:ss');

  if (endDate.isAfter(currentDate)) {
    if (startDate.isAfter(currentDate)) {
      remainingDays += endDate.diff(startDate, 'days');
      remainingHours += endDate.diff(startDate, 'hours') % 24;
    } else {
      remainingDays += endDate.diff(currentDate, 'days');
      remainingHours += endDate.diff(currentDate, 'hours') % 24;
    }
  } else {
    remainingDays += endDate.diff(currentDate, 'days');
    remainingHours += endDate.diff(currentDate, 'hours') % 24;
  }
} else {
  remainingDays = 0;
  remainingHours = 0;
}


        clinic._doc.remainingDays = remainingDays;
        clinic._doc.remainingHours = remainingHours;
        clinic._doc.pendingDue = (remainingDays <= 0|| remainingDays <=0)?true:false

        const doctorsCount = await doctor.countDocuments({ 'clinics.clinicId': clinic._id });
        const receptionistsCount = await Receptionist.countDocuments({ clinic: clinic._id });
        const totalStaffCount = doctorsCount + receptionistsCount;

        clinic._doc.doctorsCount = doctorsCount;
        clinic._doc.receptionistsCount = receptionistsCount;
        clinic._doc.totalStaffCount = totalStaffCount;

        return clinic;
      })
    );

    if (pendingDue !== undefined) {
      const isPendingDueTrue = pendingDue === 'true';
      clinics = clinics.filter((clinic) =>
        isPendingDueTrue ? clinic._doc.remainingDays <= 0 : clinic._doc.remainingDays > 0
        
      );
      
    }

    const totalClinics = clinics.length;
    const totalPages = Math.ceil(totalClinics / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedClinics = clinics.slice(startIndex, endIndex);

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
      clinics: paginatedClinics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error:  error.message });
  }
};

function parseDate(dateString) {
  const [datePart, timePart] = dateString.split(' ');
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  
  const date = new Date(year, month - 1, day, hours, minutes, seconds);

  return date.toISOString();
}



const getClinicById = async (req, res) => {
  try {
    const id=req.user._id
    const clinic = await Clinic.findById(id)
      .populate({
        path: 'subscription_details.subscription_id',
        populate: {
          path: 'title',
        }
      });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found', errorcode: 1001 });
    }

    let balancedue = false;
    const subscriptionDetails = clinic.subscription_details;
    const subscription = subscriptionDetails.length > 0 
      ? subscriptionDetails[subscriptionDetails.length - 1]  
      : null;

    if (subscription) {
      const currentDate = moment(); // Current date
      console.log("Current date:", currentDate.toISOString());
      const enddate = moment(subscription.subscription_enddate, 'DD-MM-YYYY HH:mm:ss'); // Parse with correct format
      console.log("Subscription end date:", subscription.subscription_enddate);
      console.log("Parsed end date:", enddate.toISOString());

      if (subscription.subscription_id === null) {
        console.log("Subscription ID is null.");

        if (enddate.isSameOrAfter(currentDate)) {
          balancedue = false;
          console.log("Subscription is still active; no balance due.");
        } else {
          balancedue = true; // Subscription expired
          console.log("Subscription expired; balance due is TRUE.");
        }
      } else {
        // If subscription_id is not null, check for doctors/receptionists
        console.log("Subscription ID is present; checking for unsubscribed users...");

        const doctorsUnsubscribed = await doctor.countDocuments({
          'clinics.clinicId': id,
          'clinics.subscription': false,
        });
        const receptionistsSubscribed = await Receptionist.countDocuments({
          clinic: id,
          subscription: false,
        });

        balancedue = (doctorsUnsubscribed > 0 || receptionistsSubscribed > 0) ? true : false;
        console.log("Balance due based on unsubscribed users:", balancedue);
      }
    } else {
      console.log("No subscription found.");
    }

    const doctorsCount = await doctor.countDocuments({ 'clinics.clinicId': id });
    const receptionistsCount = await Receptionist.countDocuments({ clinic: id });

    res.json({
      success: true,
      message: "Clinic fetched successfully",
      clinic,
      balancedue,
      doctorsCount,
      receptionistsCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};





const getClinicId = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id)
      .populate({
        path: 'subscription_details.subscription_id',
        populate: {
          path: 'title',
        }
      });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found', errorcode: 1001 });
    }

    let balancedue = false;
    const subscriptionDetails = clinic.subscription_details;
    const subscription = subscriptionDetails.length > 0 
      ? subscriptionDetails[subscriptionDetails.length - 1]  
      : null;

    if (subscription) {
      const currentDate = moment(); // Current date
      console.log("Current date:", currentDate.toISOString());
      const enddate = moment(subscription.subscription_enddate, 'DD-MM-YYYY HH:mm:ss'); // Parse with correct format
      console.log("Subscription end date:", subscription.subscription_enddate);
      console.log("Parsed end date:", enddate.toISOString());

      if (subscription.subscription_id === null) {
        console.log("Subscription ID is null.");

        if (enddate.isSameOrAfter(currentDate)) {
          balancedue = false;
          console.log("Subscription is still active; no balance due.");
        } else {
          balancedue = true; // Subscription expired
          console.log("Subscription expired; balance due is TRUE.");
        }
      } else {
        // If subscription_id is not null, check for doctors/receptionists
        console.log("Subscription ID is present; checking for unsubscribed users...");

        const doctorsUnsubscribed = await doctor.countDocuments({
          'clinics.clinicId': req.params.id,
          'clinics.subscription': false,
        });
        const receptionistsSubscribed = await Receptionist.countDocuments({
          clinic: req.params.id,
          subscription: false,
        });

        balancedue = (doctorsUnsubscribed > 0 || receptionistsSubscribed > 0) ? true : false;
        console.log("Balance due based on unsubscribed users:", balancedue);
      }
    } else {
      console.log("No subscription found.");
    }

    const doctorsCount = await doctor.countDocuments({ 'clinics.clinicId': req.params.id });
    const receptionistsCount = await Receptionist.countDocuments({ clinic: req.params.id });

    res.json({
      success: true,
      message: "Clinic fetched successfully",
      clinic,
      balancedue,
      doctorsCount,
      receptionistsCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};




const updateClinic = async (req, res) => {
  try {
    let updateData = { ...req.body };
    console.log(req.body.email);

    const existingClinic = await Clinic.findById(req.params.id);
    if (!existingClinic) {
      return res.status(404).json({ success: false, error: "Clinic not found", errorcode: 1001 });
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


    updateData.details = true;
    const clinic = await Clinic.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!clinic) {
      return res.status(400).json({ success: false, error: "Clinic update failed", errorcode: 1001 });
    }

    if (!existingClinic.details) {
      createNotification("admin", clinic._id, `New clinic ${req.body.clinic_name} added`);
    }

    res.status(200).json({ success: true, message: "Clinic updated successfully", clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    const { specialist, recently_joined, onleave, page = 1, limit = 10, verify, subscription } = req.query;

    const todayUTC = new Date().toISOString().split('T')[0]; 

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
    if (subscription) {
      doctorQuery["clinics.subscription"] = true;
    }

    const totalDoctors = await doctor.countDocuments(doctorQuery);
    const totalPages = Math.ceil(totalDoctors / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const doctors = await doctor.find(doctorQuery)
      .limit(limit)
      .skip(startIndex);

    const doctorAvailabilityPromises = doctors.map(async (doctor) => {
      const clinicDetails = doctor.clinics.find(clinic => clinic.clinicId.toString() === id);

      const availabilityDoc = await Availability.findOne({
        doctorId: doctor._id,
        clinicId: id
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
        doctor: {
          ...doctor.toObject(),
          clinics: clinicDetails ? [clinicDetails] : [] 
        },
        availability: availabilityStatus
      };
    });

    const doctorAvailability = await Promise.all(doctorAvailabilityPromises);

    const availableDoctorsCount = doctorAvailability.filter(doc => doc.availability === 'available').length;
    const unavailableDoctorsCount = doctorAvailability.filter(doc => doc.availability === 'unavailable').length;

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
      doctorAvailability: doctorAvailability,
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
    createNotification("admin",req.admin._id,`You ${action} ${clinic.clinic_name} for ${reason}`)

    res.json({ success: true, message: `Clinic ${action} successfully`, clinic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



// const update_Subscription = async (req, res) => {
//   try {
//     const { subscription_id, transaction_id, subscription_startdate, subscription_enddate,amount } = req.body;
//     const clinicId = req.params.id;

//     const clinic = await Clinic.findById(clinicId);
//     if (!clinic) {
//       return res.status(404).send({ success: false, error: errormesaages[1001], errorcode: 1001 });
//     }

 
// if (transaction_id === "free_trail") {

//       const subscriptionDuration = await freetrail.findById(subscription_id);
//       if (!subscriptionDuration) {
//         return res.status(404).send({ success: false, error: errormesaages[1041], errorcode: 1042});
//       }
//       console.log("Free trial subscription detected");

//       const doctorsUnsubscribed = await doctor.countDocuments({ 'clinics.clinicId': clinicId, subscription: false });
//     const receptionistsUnsubscribed = await Receptionist.countDocuments({ clinic: clinicId, subscription: false });

//       clinic.subscription = true;

//       clinic.subscription_details.push({
//         subscription_id: subscription_id,
//         billinghistory: [{ transaction_id, amount:amount, doctor:doctorsUnsubscribed, receptionist:receptionistsUnsubscribed }],
//         subscription_startdate: subscription_startdate,
//         subscription_enddate: subscription_enddate
//       });
//       const receptionists = await Receptionist.updateMany(
//         { clinic: clinicId },
//         { subscription:true },
//         { new: true }
//       );
  
//       const doctors = await doctor.updateMany(
//         { "clinics.clinicId": clinicId },
//         { $set: { "clinics.$.subscription": true } },
//         { new: true }
//       );
//     } else {
//       const subscriptionDuration = await SubscriptionDuration.findById(subscription_id);
//       if (!subscriptionDuration) {
//         return res.status(404).send({ success: false, error: errormesaages[1041], errorcode: 1043 });
//       }
//       let currentDate = moment();
//       if (clinic.subscription_details.length > 0) {
//         const lastSubscription = clinic.subscription_details[clinic.subscription_details.length - 1];
//         const lastEndDate = moment(lastSubscription.subscription_enddate, 'DD-MM-YYYY HH:mm:ss');
//         if (lastEndDate.isAfter(currentDate)) {
//           currentDate = lastEndDate.add(1, 'seconds');
//         }
//       }

//       let endDate;
//       if (subscriptionDuration.duration === 'month') {
//         endDate = currentDate.clone().add(subscriptionDuration.durationInNo, 'months');
//       } else if (subscriptionDuration.duration === 'year') {
//         endDate = currentDate.clone().add(subscriptionDuration.durationInNo, 'years');
//       } else if (subscriptionDuration.duration === 'day') {
//         endDate = currentDate.clone().add(subscriptionDuration.durationInNo, 'days');
//       } else {
//         return res.status(400).send({ success: false, error: errormesaages[1045], errorcode: 1045 });
//       }
  

//       const formattedStartDate = currentDate.format('DD-MM-YYYY HH:mm:ss');
//       const formattedEndDate = endDate.format('DD-MM-YYYY HH:mm:ss');
//       const receptionistsUnsubscribed = await Receptionist.countDocuments({ clinic: clinicId, subscription: false });
//       const doctorsUnsubscribed = await doctor.countDocuments({ 'clinics.clinicId': clinicId, subscription: false });

//       clinic.subscription_details.push({
//         subscription_id,
//         billinghistory: [{ transaction_id, amount, doctor:doctorsUnsubscribed, receptionist:receptionistsUnsubscribed }],
//         subscription_startdate: formattedStartDate,
//         subscription_enddate: formattedEndDate
//       });
//     }

//     await clinic.save();

//     createNotification("admin", clinic._id, `${clinic.clinic_name} paid for subscription, verify payment`);

//     res.status(200).send({ success: true, message: 'Subscription details updated successfully', clinic });
//   } catch (error) {
//     console.error('Error updating subscription details:', error);
//     res.status(500).send({ success: false, error: error.message });
//   }
// };
const update_Subscription = async (req, res) => {
  try {
    const { subscription_id, transaction_id, subscription_startdate, subscription_enddate, amount } = req.body;
    const clinicId = req.params.id;

    // Find the clinic
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).send({ success: false, error: errormesaages[1001], errorcode: 1001 });
    }

    // Check for existing subscription details
    let lastEndDate;
    if (clinic.subscription_details.length > 0) {
      const lastSubscription = clinic.subscription_details[clinic.subscription_details.length - 1];
      lastEndDate = moment(lastSubscription.subscription_enddate, 'DD-MM-YYYY HH:mm:ss');
      const currentDate = moment();
      console.log("Current Date:", currentDate, "Last End Date:", lastEndDate);

      if (currentDate.isBefore(lastEndDate)) {
        return res.status(400).send({
          success: false,
          message: 'Current subscription is still active. Cannot add a new subscription until it expires.'
        });
      }
    }

    // Handle free trial subscriptions
    if (transaction_id === "free_trail") {
      const subscriptionDuration = await freetrail.findById(subscription_id);
      if (!subscriptionDuration) {
        return res.status(404).send({ success: false, error: errormesaages[1041], errorcode: 1042 });
      }
      console.log("Free trial subscription detected");

      const doctorsUnsubscribed = await doctor.countDocuments({ 'clinics.clinicId': clinicId, subscription: false });
      const receptionistsUnsubscribed = await Receptionist.countDocuments({ clinic: clinicId, subscription: false });

      clinic.subscription = true;

      clinic.subscription_details.push({
        subscription_id: subscription_id,
        billinghistory: [{ transaction_id, amount: amount, doctor: doctorsUnsubscribed, receptionist: receptionistsUnsubscribed }],
        subscription_startdate: subscription_startdate,
        subscription_enddate: subscription_enddate
      });

      await Receptionist.updateMany({ clinic: clinicId }, { subscription: true }, { new: true });
      await doctor.updateMany({ "clinics.clinicId": clinicId }, { $set: { "clinics.$.subscription": true } }, { new: true });

    } else {
      // Handle regular subscription duration
      const subscriptionDuration = await SubscriptionDuration.findById(subscription_id);
      if (!subscriptionDuration) {
        return res.status(404).send({ success: false, error: errormesaages[1041], errorcode: 1043 });
      }

      // If last subscription exists, use lastEndDate + 1 second, otherwise use current date
      let startDate = lastEndDate ? lastEndDate.clone().add(1, 'seconds') : moment();
      let endDate;

      // Calculate new end date based on subscription duration
      if (subscriptionDuration.duration === 'month') {
        endDate = startDate.clone().add(subscriptionDuration.durationInNo, 'months');
      } else if (subscriptionDuration.duration === 'year') {
        endDate = startDate.clone().add(subscriptionDuration.durationInNo, 'years');
      } else if (subscriptionDuration.duration === 'day') {
        endDate = startDate.clone().add(subscriptionDuration.durationInNo, 'days');
      } else {
        return res.status(400).send({ success: false, error: errormesaages[1045], errorcode: 1045 });
      }

      console.log("Start Date:", startDate, "End Date:", endDate);

      const formattedStartDate = startDate.format('DD-MM-YYYY HH:mm:ss');
      const formattedEndDate = endDate.format('DD-MM-YYYY HH:mm:ss');
      const receptionistsUnsubscribed = await Receptionist.countDocuments({ clinic: clinicId, subscription: false });
      const doctorsUnsubscribed = await doctor.countDocuments({ 'clinics.clinicId': clinicId, subscription: false });

      // Update subscription details with new subscription info
      clinic.subscription_details.push({
        subscription_id,
        billinghistory: [{ transaction_id, amount, doctor: doctorsUnsubscribed, receptionist: receptionistsUnsubscribed }],
        subscription_startdate: formattedStartDate,
        subscription_enddate: formattedEndDate
      });
    }

    // Save updated clinic information
    await clinic.save();

    // Trigger notification
    createNotification("admin", clinic._id, `${clinic.clinic_name} paid for subscription, verify payment`);

    // Send successful response
    res.status(200).send({ success: true, message: 'Subscription details updated successfully', clinic });
  } catch (error) {
    console.error('Error updating subscription details:', error);
    res.status(500).send({ success: false, error: error.message });
  }
};




const getsubscriptiondays = async (req, res) => {
  try {
    const clinicId = req.params.id;

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).send({ success: false, error: errormesaages[1001], errorcode: 1001 });
    }

    if (!clinic.subscription_details || clinic.subscription_details.length === 0) {
      return res.status(400).send({ success: false, error: errormesaages[1026], errorcode: 1026 });
    }

    const currentDate = moment();
    let remainingDays = 0;
    let remainingHours = 0;

    for (let i = 0; i < clinic.subscription_details.length; i++) {
      const subscriptionDetail = clinic.subscription_details[i];
      const startDate = moment(subscriptionDetail.subscription_startdate, 'DD-MM-YYYY HH:mm:ss');
      const endDate = moment(subscriptionDetail.subscription_enddate, 'DD-MM-YYYY HH:mm:ss');

      if (endDate.isAfter(currentDate)) {
        if (startDate.isAfter(currentDate)) {
          remainingDays += endDate.diff(startDate, 'days');
          remainingHours += endDate.diff(startDate, 'hours') % 24;
        } else {
          remainingDays += endDate.diff(currentDate, 'days');
          remainingHours += endDate.diff(currentDate, 'hours') % 24;
        }
      } else {
        remainingDays += endDate.diff(currentDate, 'days'); 
        remainingHours += endDate.diff(currentDate, 'hours') % 24; 
      }
    }

    res.status(200).json({ success: true, remainingDays, remainingHours, subscription_details: clinic.subscription_details });
  } catch (error) {
    console.error('Error calculating remaining days:', error);
    res.status(500).send({ success: false, error: error.message });
  }
};

const verify_subscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscription } = req.body;

    const Clinics = await Clinic.findById(id);

    const lastSubscription = Clinics.subscription_details[Clinics.subscription_details.length - 1];
    const lastEndDate = moment(lastSubscription.subscription_enddate, 'DD-MM-YYYY HH:mm:ss');
    const currentDate = moment();

    console.log("Current Date:", currentDate, "Last End Date:", lastEndDate);

    if (currentDate.isBefore(lastEndDate)) {
      const clinic = await Clinic.findOneAndUpdate(
        { _id: id },
        { subscription },
        { new: true }
      );

      if (!clinic) {
        return res.status(404).json({ success: false, message: 'Clinic not found' });
      }

      createNotification("clinic", id, "Clinic subscription verified by admin successfully");

      const receptionists = await Receptionist.updateMany(
        { clinic: id },
        { subscription },
        { new: true }
      );

      const doctors = await doctor.updateMany(
        { "clinics.clinicId": id },
        { $set: { "clinics.$.subscription": subscription } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Clinic subscription verified successfully and updated for associated doctors and receptionists',
        clinic,
        updatedReceptionists: receptionists.modifiedCount,
        updatedDoctors: doctors.modifiedCount
      });

    } else {
      res.status(400).json({
        success: false,
        message: "Subscription has expired. Please add a new subscription to verify."
      });

   
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const calculateTotalSubscriptionAmount = async (req, res) => {
  const { clinicId,subscription_id } = req.params;

  try {
    const clinic = await Clinic.findById(clinicId);

    if (!clinic) {
      return res.status(404).send({ success: false, error: "Clinic not found" });
    }


    const subscriptionDuration = await SubscriptionDuration.findById(subscription_id);

    if (!subscriptionDuration) {
      return res.status(404).send({ success: false, error: "Subscription duration not found" });
    }

    const doctorsCount = await doctor.countDocuments({ 'clinics.clinicId': clinicId });
    const receptionistsCount = await Receptionist.countDocuments({ clinic: clinicId });

    const totalStaffCount = doctorsCount + receptionistsCount;

    const totalAmount = subscriptionDuration.pricePerMonth * totalStaffCount;

    res.status(200).send({
      success: true,
      clinicName: clinic.clinic_name,
      subscriptionAmountPerStaff: subscriptionDuration.amount,
      totalStaffCount,
      totalAmount
    });
  } catch (error) {
    console.error('Error calculating total subscription amount:', error);
    res.status(500).send({ success: false, error: error.message });
  }
}
const verifyDoctorSubscription = async (req, res) => {
  try {
    const doctors = await doctor.findOneAndUpdate(
      { _id: req.params.id, "clinics.clinicId": req.body.clinicId },
      { "clinics.$.subscription": req.body.subscription },
      { new: true }
    );

    createNotification("doctor", req.params.id, "Doctor subscription verified by admin successfully");

    res.status(200).json({ success: true, message: 'Doctor subscription verified successfully', doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const verifyReceptionistSubscription = async (req, res) => {
  try {
    const receptionist = await Receptionist.findOneAndUpdate(
      { _id: req.params.id },
      { subscription: req.body.subscription },
      { new: true }
    );

    createNotification("receptionist", req.params.id, "Receptionist subscription verified by admin successfully");

    res.status(200).json({ success: true, message: 'Receptionist subscription verified successfully', receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const calculateUnsubscriptionAmount = async (req, res) => {
  const { clinicId,subscription_id } = req.params;

  try {
    const clinic = await Clinic.findById(clinicId).populate('subscription_details.subscription_id');

    if (!clinic) {
      return res.status(404).send({ success: false, error: "Clinic not found" });
    }

    const subscriptionDuration = await SubscriptionDuration.findById(subscription_id);

    if (!subscriptionDuration) {
      return res.status(404).send({ success: false, error: "Subscription duration not found" });
    }

    const subscriptionDurations = await SubscriptionDuration.findById(subscription_id).populate("title")

    if (!subscriptionDuration) {
      return res.status(404).send({ success: false, error: "Subscription duration not found" });
    }

    const doctorsSubscribed = await doctor.countDocuments({
      'clinics.clinicId': clinicId,
      'clinics.subscription': true
    });

    const doctorsUnsubscribed = await doctor.countDocuments({
      'clinics.clinicId': clinicId,
      'clinics.subscription': false
    });
    const receptionistsSubscribed = await Receptionist.countDocuments({ clinic: clinicId, subscription: true });
    const receptionistsUnsubscribed = await Receptionist.countDocuments({ clinic: clinicId, subscription: false });
console.log(doctorsSubscribed,doctorsUnsubscribed)
    const unsubscriptionAmountDoctors = doctorsUnsubscribed * subscriptionDuration.pricePerMonth;
    const unsubscriptionAmountReceptionists = receptionistsUnsubscribed * subscriptionDuration.pricePerMonth;

    const totalUnsubscriptionAmount = unsubscriptionAmountDoctors + unsubscriptionAmountReceptionists;

    res.status(200).send({
      success: true,
      clinicName: clinic.clinic_name,
      doctors: {
        subscribed: doctorsSubscribed,
        unsubscribed: doctorsUnsubscribed,
        unsubscriptionAmount: unsubscriptionAmountDoctors,
      },
      receptionists: {
        subscribed: receptionistsSubscribed,
        unsubscribed: receptionistsUnsubscribed,
        unsubscriptionAmount: unsubscriptionAmountReceptionists,
      },
      totalUnsubscriptionAmount,
      subscriptionDurations
    });
  } catch (error) {
    console.error('Error calculating unsubscription amount:', error);
    res.status(500).send({ success: false, error: error.message });
  }
};


const   updateBillingHistory = async (req, res) => {
  try {
    const { clinicId, subscriptionDetailId } = req.params;
    const { transaction_id, amount } = req.body;

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).send({ success: false, error: 'Clinic not found', errorcode: 1001 });
    }

    const subscriptionDetail = clinic.subscription_details.id(subscriptionDetailId);
    if (!subscriptionDetail) {
      return res.status(404).send({ success: false, error: 'Subscription detail not found', errorcode: 1041 });
    }
    const receptionistsUnsubscribed = await Receptionist.countDocuments({ clinic: clinicId, subscription: false });
    const doctorsUnsubscribed = await doctor.countDocuments({
      'clinics.clinicId': clinicId,
      'clinics.subscription': false
    });

    subscriptionDetail.billinghistory.push({
      transaction_id,
      amount,
      doctor: doctorsUnsubscribed,
      receptionist: receptionistsUnsubscribed
    });

    await clinic.save();

    res.status(200).send({ success: true, message: 'Billing history updated successfully', clinic });
  } catch (error) {
    console.error('Error updating billing history:', error);
    res.status(500).send({ success: false, error: error.message });
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
                   getClinicId,
                   update_Subscription,
                   getsubscriptiondays,
                   verify_subscription,
                   calculateTotalSubscriptionAmount,
                   verifyDoctorSubscription,
                   verifyReceptionistSubscription,
                   calculateUnsubscriptionAmount,
                   updateBillingHistory
                  };
