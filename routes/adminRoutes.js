const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  sendOtp,
  verifyOtp,
  updateAdmin,
  blockAdmin,
  getAdminList,
} = require("../controller/adminController");
const { updateMedicineStatus } = require("../controller/medicineController");

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

module.exports = router;
