const jwt = require('jsonwebtoken');
const { Admin } = require('../modal/admin');
require('dotenv').config();

const signAdminToken = (admin) => {
  console.log(admin,process.env.JWT_SECRET)
  return jwt.sign(
    {
      _id: admin._id,
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2d' } 
  );
};

const verifyAdminToken = async (token) => {
  try {
    console.log(token,"token")
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)
    const admin = await Admin.findById(decoded._id);
    if (!admin) {
      throw new Error('Admin not found');
    }
    return admin;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const isAdmin = async (req, res, next) => {
  const { authorization } = req.headers;
console.log(authorization)
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Unauthorized - Missing or invalid token' });
  }

  try {
    const token = authorization.split(' ')[1];
    console.log("token",token)
    const admin = await verifyAdminToken(token);
console.log(admin)
    if (!admin) {
      return res.status(401).send({ message: 'Unauthorized - Admin not found' });
    }

    req.admin = admin;

    next();
  } catch (error) {
    return res.status(403).send({ message: 'Forbidden - Invalid token' });
  }
};

module.exports = {
  signAdminToken,
  verifyAdminToken,
  isAdmin
};
