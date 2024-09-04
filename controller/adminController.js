const { signAdminToken } = require("../config/adminAuth");
const { errormesaages } = require("../errormessages");
const { Admin } = require("../modal/admin");
const { Storage } = require('@google-cloud/storage');

require("dotenv").config();
const bucketName = process.env.bucketName; 
const gcsStorage = new Storage();

const sendOtp = async (req, res) => {
  const { phone } = req.body;
  const otp = "123456"; 

  try {
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    }
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
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mobile number is required and cannot be empty' });
    } if(!otp||otp===""){
      return res.status(400).json({ success: false, message: 'otp is required and cannot be empty' });

    }
    const admin = await Admin.findOne({ phone });
console.log(admin)
    if (!admin) {
      return res.status(404).json({success:false, error: "User not found" });
    }

    if (otp !== admin.otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    admin.verified = true;
    await admin.save();
    const token = signAdminToken(admin)


    res.status(200).json({success:true, message: "OTP verified successfully",  admin,token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Admin Details
const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, address, country, city, email, phone, role } = req.body;

  try {

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({success:false, error: "Admin not found" });
    }
if(req.file){
    const originalFilename = req.file.originalname;
      const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.]/g, '_');
      const imagePath = `admin_images/${Date.now()}_${sanitizedFilename}`;
      await gcsStorage.bucket(bucketName).file(imagePath).save(req.file.buffer);
      admin.image= `https://storage.cloud.google.com/${bucketName}/${imagePath}`


}
    admin.name = name || admin.name;
    admin.address = address || admin.address;
    admin.country = country || admin.country;
    admin.city = city || admin.city;
    admin.email = email || admin.email;
    admin.phone = phone || admin.phone;
   
    admin.role = role || admin.role;


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
      return res.status(404).json({success:false, error: "Admin not found" });
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

const getAdminId = async (req, res) => {
  try {
    
    const id=req?.admin._id
     const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ error:errormesaages[1009],errorcode:1009 });
    }
    res.json({ success: true, message: "admin details fetched successfully", admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
                   sendOtp, 
                   verifyOtp, 
                   updateAdmin, 
                   blockAdmin, 
                   getAdminList,
                   getAdminId
                   };

