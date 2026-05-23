const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId) =>
  jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId, days = 7) =>
  jwt.sign({ user: { id: userId } }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${days}d` });

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// Cookie scoped to /api/auth so it is NOT sent on every API request —
// only on the refresh, login, logout paths under that prefix.
const COOKIE_PATH = '/api/auth';

const cookieOptions = (days) => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   days * 24 * 60 * 60 * 1000,
  path:     COOKIE_PATH,
});

const setRefreshCookie = (res, token, days = 7) =>
  res.cookie('refreshToken', token, cookieOptions(days));

const clearRefreshCookie = (res) =>
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path:     COOKIE_PATH,
  });

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshCookie,
  clearRefreshCookie,
};
