const express = require('express');
const router  = express.Router();
const {
  register,
  login,
  refresh,
  logout,
  logoutAll,
} = require('../controllers/authController');
const auth = require('../middlewares/auth');
const User = require('../models/User');

router.post('/register',    register);
router.post('/login',       login);
router.post('/refresh',     refresh);
router.post('/logout',      logout);
router.post('/logout-all',  auth, logoutAll);

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
