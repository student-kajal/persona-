// const express = require('express');
// const router = express.Router();
// const { register, login } = require('../controllers/authController');
// const auth = require('../middlewares/auth');
// const User = require('../models/User');

// router.post('/register', register);
// router.post('/login', login);

// router.get('/me', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();

// 🔥 Updated imports
const { 
  register, 
  login, 
  refreshToken, 
  logout 
} = require('../controllers/authController');

const auth = require('../middlewares/auth');
const User = require('../models/User');


// ✅ REGISTER
router.post('/register', register);

// ✅ LOGIN
router.post('/login', login);

// 🔄 REFRESH TOKEN (NEW)
router.post('/refresh-token', refreshToken);

// 🚪 LOGOUT (NEW)
router.post('/logout', auth, logout);


// ✅ GET CURRENT USER
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;