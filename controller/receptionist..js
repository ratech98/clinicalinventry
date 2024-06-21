const { errormesaages } = require("../errormessages");
const { ReceptionistAvailability } = require("../modal/availablity");
const Clinic = require("../modal/clinic.");
const Receptionist = require("../modal/receptionist");

const addReceptionist = async (req, res) => {
  try {
    

    const receptionist = await Receptionist.create(req.body);
    res.status(201).json({ success: true, message: "Receptionist added successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllReceptionists = async (req, res) => {
  try {
  

    const receptionists = await Receptionist.find();
    res.json({ success: true, message: "Receptionists fetched successfully", receptionists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getReceptionists = async (req, res) => {
  try {
  

    const receptionists = await Receptionist.find({clinic:req.body.clinic}).populate('clinic');
    res.json({ success: true, message: "Receptionists fetched successfully", receptionists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getClinicDetailsByreceptionistId = async (req, res) => {
  try {
      const receptionist = await Receptionist.findById(req.body.id).populate('clinic');
      if (!receptionist) {
        return res.status(404).json({ error: 'receptionist not found' });
      }
  
      const clinics = receptionist.clinic;
      res.status(200).json({ success: true, message: 'Clinic details fetched successfully', clinics });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

const getReceptionistById = async (req, res) => {
  try {
 

    const receptionist = await Receptionist.findById(req.params.id);
    if (!receptionist) {
      return res.status(404).json({ error: errormesaages[1004], errorcode: 1004});
    }
    res.json({ success: true, message: "Receptionist fetched successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateReceptionist = async (req, res) => {
  try {
  

    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!receptionist) {
      return res.status(400).json({error: errormesaages[1004], errorcode: 1004 });
    }
    res.status(200).json({ success: true, message: "Receptionist updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteReceptionist = async (req, res) => {
  try {


    const receptionist = await Receptionist.findByIdAndDelete(req.params.id);
    if (!receptionist) {
      return res.status(400).json({error: errormesaages[1004], errorcode: 1004 });
    }
    res.json({ success: true, message: "Receptionist deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateReceptionistStatus = async (req, res) => {
  try {
    

    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id, { availablity: req.body.availablity }, { new: true });
    if (!receptionist) {
      return res.status(400).json({ error: errormesaages[1004], errorcode: 1004 });
    }
    res.status(200).json({ success: true, message: "Receptionist status updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const updateReceptionistVerify = async (req, res) => {
  try {


    const receptionist = await Receptionist.findByIdAndUpdate(req.params.id, { verify: req.body.verify }, { new: true });
    if (!receptionist) {
      return res.status(400).json({error: errormesaages[1004], errorcode: 1004  });
    }
    res.status(200).json({ success: true, message: "Receptionist status updated successfully", receptionist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addClinicToReceptionist = async (req, res) => {
  const { receptionistId, clinicId } = req.body;

  try {
    const receptionist = await Receptionist.findById(receptionistId);
    if (!receptionist) {
      return res.status(404).json({ error: 'Receptionist not found' });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    receptionist.clinic.push(clinic._id);
    await receptionist.save();

    res.status(200).json({ message: 'Clinic added to receptionist successfully', receptionist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addReceptionistAvailability = async (req, res) => {
  const { receptionistId, clinicId, date, startTime, endTime } = req.body;

  try {
    const receptionist = await Receptionist.findById(receptionistId);
    if (!receptionist) {
      return res.status(404).json({ error: 'Receptionist not found' });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const availability = new ReceptionistAvailability({
      receptionist: receptionistId,
      clinic: clinicId,
      date,
      startTime,
      endTime
    });

    await availability.save();

    res.status(201).json({ message: 'Availability added successfully', availability });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateReceptionistAvailability = async (req, res) => {

  const { date, startTime, endTime,id } = req.body;

  try {
    const availability = await ReceptionistAvailability.findById(id);
    if (!availability) {
      return res.status(404).json({ error: 'Receptionist availability not found' });
    }

    // Update the availability fields
    if (date) availability.date = date;
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;

    await availability.save();

    res.status(200).json({ message: 'Receptionist availability updated successfully', availability });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = { addReceptionist, 
                    getAllReceptionists, 
                    getReceptionistById, 
                    updateReceptionist,
                     deleteReceptionist, 
                     updateReceptionistStatus, 
                    updateReceptionistVerify,
                    addClinicToReceptionist,
                    addReceptionistAvailability,
                    updateReceptionistAvailability,
                    getReceptionists,
                    getClinicDetailsByreceptionistId
                    };
