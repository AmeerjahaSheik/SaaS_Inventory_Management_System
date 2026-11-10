const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../validators/authValidator');
const validateRequest = require('../middleware/validateRequest');
const authenticate = require('../middleware/authMiddleware');

router.post('/signup', validateSignup, validateRequest, authController.signup);
router.post('/login', validateLogin, validateRequest, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;

