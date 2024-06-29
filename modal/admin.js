const mongoose = require("mongoose");


const adminSchema = new mongoose.Schema(
  {
    name: {
      type: Object,
      
    },
    image: {
      type: String,
     
    },
    address: {
      type: String,
     
    },
    country: {
      type: String,
     
    },
    city: {
      type: String,
      
    },

    email: {
      type: String,
      
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: false,
      default: "Active",
      enum: ["Active", "Inactive"],
    },
    password: {
      type: String,
      
      
    },
    role: {
      type: String,
      required: true,
      default: "Admin",
      enum: [
        "Admin",
        "Super Admin",
        "Cashier",
        "Manager",
        "CEO",
        "Driver",
        "Security Guard",
        "Accountant",
      ],
    },
    joiningData: {
      type: Date,
      
    },
    otp:{type:Number},
    verified:{type:Boolean,default:false},
    block:{type:Boolean,default:false},
    block_reason:{type:String},
    unblock_reason:{type:String}
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model("Admin", adminSchema);

const staffRoleSchema= new mongoose.Schema(
    {
     
      role:{
        type:String
      },
      published:{
        type:Boolean,
        default:false
      }
      
    },
    {
      timestamps: true,
    }
  );
  
  const StaffRole = mongoose.model("StaffRole", staffRoleSchema);
  
  
  module.exports = {Admin,StaffRole}