const { Admin } = require("../modal/admin");
const { Storage } = require('@google-cloud/storage');

require("dotenv").config();
const bucketName = process.env.bucketName; 
const gcsStorage = new Storage();

const sendOtp = async (req, res) => {
  const { phone } = req.body;
  const otp = "123456"; 

  try {
    let admin = await Admin.findOne({ phone });

    if (!admin) {
      admin = new Admin({
        phone,
        otp,
        verified: false,
        block: false,
      });
      await admin.save();
    } else {
      admin.otp = otp;
      admin.verified = false;
      await admin.save();
    }

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const admin = await Admin.findOne({ phone });
console.log(admin)
    if (!admin) {
      return res.status(404).json({ error: "User not found" });
    }

    if (otp !== admin.otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    admin.verified = true;
    await admin.save();


    res.status(200).json({success:true, message: "OTP verified successfully",  admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Admin Details
const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, address, country, city, email, phone, role } = req.body;

  try {

    const originalFilename = req.file.originalname;
      const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.]/g, '_');
      const imagePath = `admin_images/${Date.now()}_${sanitizedFilename}`;
      await gcsStorage.bucket(bucketName).file(imagePath).save(req.file.buffer);
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    admin.name = name || admin.name;
    admin.address = address || admin.address;
    admin.country = country || admin.country;
    admin.city = city || admin.city;
    admin.email = email || admin.email;
    admin.phone = phone || admin.phone;
   
    admin.role = role || admin.role;
    admin.image= `https://storage.cloud.google.com/${bucketName}/${imagePath}`,


    await admin.save();

    res.status(200).json({ success: true, message: "Admin updated successfully", admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Block Admin
const blockAdmin = async (req, res) => {
  const { id } = req.params;
  const { block, reason } = req.body;

  try {
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    admin.block = block;
    if (block) {
      admin.block_reason = reason;
    } else {
      admin.unblock_reason = reason;
    }

    await admin.save();

    const message = block ? "Admin blocked successfully" : "Admin unblocked successfully";
    res.status(200).json({ success: true, message, admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAdminList = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendOtp, verifyOtp, updateAdmin, blockAdmin, getAdminList };

