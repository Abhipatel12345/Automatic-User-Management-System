const express = require('express');
const router = express.Router();
const { login, getMe, debugAuth } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.get('/debug', debugAuth);

module.exports = router;
