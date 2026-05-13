const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Support new Authorization: Bearer header AND legacy x-auth-token header
  let token = req.header('x-auth-token');

  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token)
    return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    res.status(401).json({ error: 'Invalid token' });
  }
};
