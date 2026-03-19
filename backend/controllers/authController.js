// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// exports.register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     const userExists = await User.findOne({ email });
//     if (userExists) return res.status(400).json({ error: 'User already exists' });

//     const user = new User({ name, email, password });
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(password, salt);
//     await user.save();

//     const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.json({ token });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// exports.login = async (req, res) => {
//   const { email, password } = req.body;
//   console.log('Login attempt:', email);  // Yeh backend logs mein dikhega
//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       console.log('User not found:', email);
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }
//     if (!(await bcrypt.compare(password, user.password))) {
//       console.log('Password mismatch for:', email);
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }
//     const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.json({ token });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 Token generators
const generateAccessToken = (id) => {
  return jwt.sign(
    { user: { id } },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { user: { id } },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};


// ✅ REGISTER (UPDATED)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ name, email, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // 🔥 Direct login after register
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    // HTTP-only cookie
   res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true, // 🔥 DEV ke liye
  sameSite: 'None', // 🔥 DEV ke liye
  maxAge: 7 * 24 * 60 * 60 * 1000
});

    res.status(201).json({ accessToken });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ LOGIN (UPDATED)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', email);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    // 🔥 HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true, // 🔥 DEV ke liye
  sameSite: 'None', // 🔥 DEV ke liye
  maxAge: 7 * 24 * 60 * 60 * 1000
});

    res.json({ accessToken });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🔄 REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.user.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const newAccessToken = generateAccessToken(user.id);

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    res.status(403).json({ error: 'Token expired' });
  }
};


// 🚪 LOGOUT
exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.user.id);

      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    } catch (err) {}
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};