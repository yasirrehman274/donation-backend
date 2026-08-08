const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authValidation = require('../validations/authValidation');
const { authenticate, validate } = require('../middleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

router.post('/login', loginLimiter, authValidation.loginValidation, validate, authController.login);
router.post('/register', authValidation.registerValidation, validate, authController.register);
router.get('/profile', authenticate, authController.profile);
router.put(
  '/profile',
  authenticate,
  authValidation.profileUpdateValidation,
  validate,
  authController.updateProfile
);
router.put(
  '/change-password',
  authenticate,
  authValidation.changePasswordValidation,
  validate,
  authController.changePassword
);

module.exports = router;
