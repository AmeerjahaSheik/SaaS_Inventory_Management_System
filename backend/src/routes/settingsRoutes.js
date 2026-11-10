const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { validateSettings } = require('../validators/productValidator');
const validateRequest = require('../middleware/validateRequest');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/organization', settingsController.getSettings);
router.put('/organization', validateSettings, validateRequest, settingsController.updateSettings);

module.exports = router;

