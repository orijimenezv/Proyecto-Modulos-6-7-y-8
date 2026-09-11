const router = require('express').Router();
const { loadConfig } = require('../config/env');
router.post('/login', require('../middlewares/rateLimit')({ limit: loadConfig().loginLimit }), require('../controllers/authController').login);
module.exports = router;
