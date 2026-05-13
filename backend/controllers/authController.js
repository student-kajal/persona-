const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/tokenUtils');

// ── Helper: issue access + refresh tokens, persist refresh hash in DB ────────
async function issueTokens(userId, res, rememberMe = false) {
  const days         = rememberMe ? 30 : 7;
  const accessToken  = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId, days);

  await RefreshToken.create({
    user:      userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });

  setRefreshCookie(res, refreshToken, days);
  return accessToken;
}

// ── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ error: 'User already exists' });

    const user     = new User({ name, email, password });
    const salt     = await bcrypt.genSalt(10);
    user.password  = await bcrypt.hash(password, salt);
    await user.save();

    const accessToken = await issueTokens(user.id, res);
    res.json({ token: accessToken, accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password, rememberMe = false } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = await issueTokens(user.id, res, rememberMe);
    // Return both keys — 'token' for backward compat, 'accessToken' for new interceptor
    res.json({ token: accessToken, accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Refresh ───────────────────────────────────────────────────────────────────
// Called automatically by the frontend axios interceptor when access token expires.
exports.refresh = async (req, res) => {
  const incoming = req.cookies?.refreshToken;
  if (!incoming) return res.status(401).json({ error: 'No refresh token' });

  try {
    const decoded = jwt.verify(incoming, process.env.JWT_REFRESH_SECRET);

    // Verify token exists in DB (not revoked)
    const stored = await RefreshToken.findOne({ tokenHash: hashToken(incoming) });
    if (!stored) return res.status(401).json({ error: 'Refresh token revoked' });

    // Token rotation: delete old, issue new
    await RefreshToken.deleteOne({ _id: stored._id });

    const rememberMe  = stored.expiresAt - Date.now() > 7 * 24 * 60 * 60 * 1000;
    const accessToken = await issueTokens(decoded.user.id, res, rememberMe);

    res.json({ token: accessToken, accessToken });
  } catch (err) {
    clearRefreshCookie(res);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    res.status(500).json({ error: err.message });
  }
};

// ── Logout (current device) ───────────────────────────────────────────────────
exports.logout = async (req, res) => {
  const incoming = req.cookies?.refreshToken;
  if (incoming) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(incoming) }).catch(() => {});
  }
  clearRefreshCookie(res);
  res.json({ success: true });
};

// ── Logout all devices ────────────────────────────────────────────────────────
exports.logoutAll = async (req, res) => {
  try {
    await RefreshToken.deleteMany({ user: req.user.id });
    clearRefreshCookie(res);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
