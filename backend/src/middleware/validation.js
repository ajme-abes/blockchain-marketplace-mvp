const { body, param, query, validationResult } = require('express-validator');

// Common validation rules
const commonValidations = {
  email: body('email').isEmail().normalizeEmail(),
  password: body('password').isLength({ min: 6 }),
  name: body('name').isLength({ min: 2, max: 100 }).trim(),
  phone: body('phone').isMobilePhone().optional(),
  uuid: param('id').isUUID(),
  page: query('page').isInt({ min: 1 }).optional(),
  limit: query('limit').isInt({ min: 1, max: 100 }).optional()
};

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errorMessages
    });
  };
};

// Specific validation chains
const userRegistrationValidation = validate([
  commonValidations.email,
  commonValidations.password,
  commonValidations.name,
  commonValidations.phone,
  body('role').isIn(['BUYER', 'PRODUCER', 'ADMIN']),
  body('address').isLength({ min: 5 }).optional()
]);

const productCreationValidation = validate([
  commonValidations.name,
  body('category').isLength({ min: 2, max: 50 }),
  body('price').isFloat({ min: 0.01 }),
  body('quantityAvailable').isInt({ min: 0 }),
  body('description').isLength({ max: 1000 }).optional()
]);

const orderCreationValidation = validate([
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isUUID(),
  body('items.*.quantity').isInt({ min: 1 })
]);

const uuidParamValidation = validate([
  commonValidations.uuid
]);

const paginationValidation = validate([
  commonValidations.page,
  commonValidations.limit
]);

module.exports = {
  validate,
  userRegistrationValidation,
  productCreationValidation,
  orderCreationValidation,
  uuidParamValidation,
  paginationValidation,
  commonValidations
};