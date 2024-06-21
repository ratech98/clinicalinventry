require("dotenv").config();
const jwt = require("jsonwebtoken");
const Clinic = require("../modal/clinic.");


const signInToken = (user) => {
  console.log(process.env.JWT_SECRET)
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile_number:user.mobile_number
   
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

const isAuth = async (req, res, next) => {
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

const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Unauthorized - Missing or invalid token' });
  }

  try {
    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Assuming you have a User model to fetch user details
    const user = await Clinic.findById(decoded._id);

    if (!user) {
      return res.status(401).send({ message: 'Unauthorized - User not found' });
    }

    // if (user.block) {
    //   return res.status(403).send({ message: 'User is blocked', block_reason: user.block_reason });
    // }

    next();
  } catch (error) {
    return res.status(400).send({ message: 'Unauthorized - Invalid token' });
  }
};


module.exports = {
  signInToken,
  tokenForVerify,
  isAuth,
  verifyToken
 
};
