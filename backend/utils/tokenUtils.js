const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId) =>
  jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId, days = 7) =>
  jwt.sign({ user: { id: userId } }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${days}d` });

// Store only the hash in DB — raw token lives only in the httpOnly cookie
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const cookieOptions = (days) => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   days * 24 * 60 * 60 * 1000,
  path:     '/',
});

const setRefreshCookie = (res, token, days = 7) =>
  res.cookie('refreshToken', token, cookieOptions(days));

const clearRefreshCookie = (res) =>
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path:     '/',
  });

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshCookie,
  clearRefreshCookie,
};
