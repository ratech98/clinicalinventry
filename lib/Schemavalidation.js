const Joi = require('joi');


const registrationSchema = Joi.object({
  first_name: Joi.string().when('signin_type', {
    is: 'EMAIL',
    then: Joi.string().required(),
    otherwise: Joi.string()
  }),
  last_name: Joi.string().when('signin_type', {
    is: 'EMAIL',
    then: Joi.string().required(),
    otherwise: Joi.string()
  }),
  email: Joi.string().email().required(),
  country_code: Joi.string().when('signin_type', {
    is: 'EMAIL',
    then: Joi.string().required(),
    otherwise: Joi.string()
  }),
  phone_number: Joi.string().when('signin_type', {
    is: 'EMAIL',
    then: Joi.string().required(),
    otherwise: Joi.string()
  }),
  company_name: Joi.string().when('signin_type', {
    is: 'EMAIL',
    then: Joi.string().required(),
    otherwise: Joi.string()
  }),
  password: Joi.string().min(8).when('signin_type', {
    is: 'EMAIL',
    then: Joi.string().required(),
    otherwise: Joi.string()
  }),
  confirm_password: Joi.string().valid(Joi.ref('password')).when('signin_type', {
    is: 'EMAIL',
    then: Joi.string().required(),
    otherwise: Joi.string()
  }),
  terms_and_condition: Joi.boolean(),
  signin_type: Joi.string().valid('EMAIL', 'SOCIAL_LOGIN').required()
});


const resendOtpSchema = Joi.object({
    email: Joi.string().email().required(),
});


const resetpasswordschema=Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    confirm_password: Joi.string().valid(Joi.ref('password')).required(),

});
// Joi schema for forgotpassword API
const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

// Joi schema for update API
const updateSchema = Joi.object({
    first_name: Joi.string().optional().allow(null,''),
    last_name: Joi.string().optional().allow(null,''),
    email: Joi.string().email().optional().allow(null,''),
    country_code: Joi.string().optional().allow(null,''),
    phone_number: Joi.string().optional().allow(null,''),
    company_name: Joi.string().optional().allow(null,''),
});
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  signin_type: Joi.string().valid('EMAIL', 'SOCIAL_LOGIN').required(),
  password: Joi.when('signin_type', {
      is: 'EMAIL',
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
  })
});


const productSchema = Joi.object({
    category: Joi.string().required(),
    subcategory: Joi.string().required(),
    productGroup: Joi.string().required(),
    productName: Joi.string().required(),
    countryOfOrigin: Joi.string().required(),
    quantity: Joi.number().required(),
    unit: Joi.string().required(),
    length: Joi.number().required(),
    breadth: Joi.number().required(),
    height: Joi.number().required(),
    transportMethod: Joi.string().required(),
    dimensionUnit: Joi.string().required(),
    description: Joi.string().required(),
    specification: Joi.string().required(),
    price: Joi.number().required(),
    currency: Joi.string().required(),
    discount: Joi.string().required(),
    productOwnerId:Joi.string(),
    sellingPrice: Joi.number().required(),
    supplyMethod: Joi.string().required(),
    supplyTime: Joi.string().required(),
    supplyAbility: Joi.string().required(),
    paymentMethod: Joi.string().required(),
    catalog: Joi.string().optional().allow(null,''),
    specificationSheet: Joi.string().optional().allow(null,''),
    qualityCertification: Joi.string(),
  });

const warehouseSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    pincode: Joi.string().required(),
  });


  const adminSchema = Joi.object({
    name: Joi.string().required().label('Name'),
    image: Joi.string().uri().optional().label('Image'),
    address: Joi.string().required().label('Address'),
    country: Joi.string().required().label('Country'),
    city: Joi.string().required().label('City'),
    email: Joi.string().email().required().label('Email'),
    phone: Joi.string().required().label('Phone'),
    status: Joi.string().valid('Active', 'Inactive').default('Active').optional().label('Status'),
    password: Joi.string().required().label('Password'),
    role: Joi.string().valid(
      'Admin', 'Super Admin', 'Cashier', 'Manager', 'CEO', 'Driver', 'Security Guard', 'Accountant'
    ).default('Admin').required().label('Role'),
    joiningdate: Joi.date().required().label('Joining Date'),
    otp: Joi.number().optional().label('OTP'),
    verified: Joi.boolean().default(false).optional().label('Verified'),
    block: Joi.boolean().default(false).optional().label('Block')
  });
  
  
  const UnitSchema = Joi.object({
    name: Joi.string().required()
    
});



// Joi schema for RFQ model
const rfqSchema = Joi.object({
  buyer: Joi.string().required(),
  productGrp: Joi.string().required(),
  category: Joi.string().required(),
  subcategory: Joi.string().required(),
  quantity: Joi.number().required(),
  quantityUnit: Joi.string(),
  package: Joi.string(),
  packageUnit: Joi.string(),
  specifications: Joi.string(),
  estimatedprice: Joi.number(),
  currency: Joi.string(),
  deliveryMethod: Joi.string(),
  paymentMethod: Joi.string(),
  country: Joi.string(),
  deliveryPort: Joi.string(),
  address: Joi.string(),
  buyerSpecificationFile: Joi.string().optional().allow(null,""),
  letterOfIntentFile: Joi.string().optional().allow(null,""),
  suppliers: Joi.array().items(Joi.string()),
  // paymentterm:Joi.string(),
  shipmentTerm:Joi.string(),
  county:Joi.string()
});

// Joi schema for ReplyRFQ model
const replyRFQSchema = Joi.object({
  rfq: Joi.string().hex().length(24).required(),
  productName: Joi.string().required(),
  quoteNumber: Joi.string().required(),
  vendorId: Joi.string().required(),
  countryOfOrigin: Joi.string().hex().length(24).required(),
  packingDetails: Joi.string().optional(),
  productLocation: Joi.string().optional(),
  pricePerUnit: Joi.number().required(),
  currency: Joi.string().hex().length(24).optional(),
  deliveryCountry: Joi.string().hex().length(24).required(),
  quantity: Joi.number().required(),
  quantityUnit: Joi.string().hex().length(24).optional(),
  shipmentTerm: Joi.string().hex().length(24).optional(),
  paymentTerm: Joi.string().hex().length(24).optional(),
  validity: Joi.date().required(),
  deliveryAddress: Joi.string().required(),
  specification: Joi.string().optional(),
  termsAndConditions: Joi.boolean().required(),
  termsConditions: Joi.string().optional(),
  totalPrice: Joi.number().required(),
  verify: Joi.boolean().default(false),
  accept: Joi.boolean().default(false),
  status: Joi.string().valid("Pending", "Accepted", "Rejected").default("Pending"),
  buyer: Joi.string().hex().length(24).required(),
  supplier: Joi.string().hex().length(24).required(),
  referenceId:Joi.string().required()
});


module.exports={
                registrationSchema,
                updateSchema,
                forgotPasswordSchema,
                resetpasswordschema,
                resendOtpSchema,
                loginSchema,
                productSchema,
                warehouseSchema,
                adminSchema,
                UnitSchema,
                rfqSchema,
                replyRFQSchema
                }