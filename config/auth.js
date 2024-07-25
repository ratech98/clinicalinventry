require("dotenv").config();
const jwt = require("jsonwebtoken");
const Clinic = require("../modal/clinic.");
const moment = require('moment');
const { errormesaages } = require("../errormessages");

const signInToken = (user) => {
  console.log(process.env.JWT_SECRET);  
  
  const userId = user.clinics && user.clinics.length > 0 
  ? user.clinics[0].clinicId 
  : (user.clinic ? user.clinic : user._id);
console.log("userid",userId)
  return jwt.sign(
    {
      _id: userId,
      name: user.name||null,
      email: user.email || null,    
      mobile_number: user.mobile_number,
      
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2d", 
    }
  );
};
const tokenForVerify = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
    },
    process.env.JWT_SECRET_FOR_VERIFY,
    { expiresIn: "2d" }
  );
};

const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;
  // console.log('authorization',authorization)
  try {
    const token = authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send({
      message: "Unauthorized - Missing or invalid token",
    });
  }
};

const isAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).send({success:false, message: errormesaages[1040] ,errorcode:1040});
  }

  try {
    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log("Decoded token:", decoded);

    const clinic = await Clinic.findById(decoded._id);

    if (!clinic) {
      return res.status(401).send({success:false, message: errormesaages[1001],errorcode:1001 });
    }

    if (clinic.block) {
      return res.status(403).send({ message:errormesaages[1042], block_reason: clinic.block_reason,errorcode:1042 });
    }

    // Check subscription status and dates
    const currentDate = moment();
    const subscriptionEndDate = moment(clinic.subscription_enddate, 'DD-MM-YYYY');
    const maxGracePeriod = 7; // Maximum allowed grace period in days

    if (clinic.subscription) {
      if (currentDate.isAfter(subscriptionEndDate)) {
        const daysSinceExpiry = currentDate.diff(subscriptionEndDate, 'days');
        
        if (daysSinceExpiry > maxGracePeriod) {
          return res.status(403).send({ message: errormesaages[1043] });
        }
      }
    } else {
      return res.status(403).send({success:false, message: errormesaages[1044],errorcode:1044 });
    }

    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(400).send({ success:false, message: errormesaages[1040] ,errorcode:1040 });
  }
};



module.exports = {
  signInToken,
  tokenForVerify,
  isAuth,
  verifyToken
 
};
