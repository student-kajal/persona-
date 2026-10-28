const User = require('../models/User');

// Privileged actions must be protected on the server, not only hidden in the UI.
module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).select('role email');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access is required' });
    }
    req.admin = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Could not verify admin access' });
  }
};
