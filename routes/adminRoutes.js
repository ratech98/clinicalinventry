const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  sendOtp,
  verifyOtp,
  updateAdmin,
  blockAdmin,
  getAdminList,
  getAdminId,
} = require("../controller/adminController");
const { updateMedicineStatus } = require("../controller/medicineController");
const { isAdmin } = require("../config/adminAuth");
const { getDoctorById } = require("../controller/doctorController");
const { getDoctorsAndAvailabilityByClinic } = require("../controller/clinicController");
const { getReceptionistsByClinic, getReceptionistById } = require("../controller/receptionist.");

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
}).single("ProfileImage");

// Routes
router.post("/send_otp", sendOtp);
router.post("/verify_otp", verifyOtp);
router.put("/updateadmin/:id",upload, updateAdmin);
router.post('/admin/block/:id',blockAdmin)
router.get('/admins',getAdminList)
router.get('/admin',isAdmin,getAdminId)
router.get('/admin/doctors/:id',isAdmin, getDoctorById);
router.get('/admin/doctersby_clinic/:id',isAdmin,getDoctorsAndAvailabilityByClinic)
router.get('/admin/receptionist/clinic/:id',isAdmin, getReceptionistsByClinic)
router.get('/admin/receptionists/:id',isAdmin, getReceptionistById);



module.exports = router;
