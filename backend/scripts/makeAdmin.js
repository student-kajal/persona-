// Usage: node scripts/makeAdmin.js admin@example.com [password-for-new-account]
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function makeAdmin() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const password = String(process.argv[3] || '');
  if (!email) throw new Error('Usage: node scripts/makeAdmin.js admin@example.com [password-for-new-account]');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');

  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    await user.save();
    console.log(`${email} is now an admin.`);
  } else {
    if (!password) throw new Error(`No user found for ${email}. Supply a password to create the admin account.`);
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ name: 'Admin', email, password: passwordHash, role: 'admin' });
    console.log(`Admin account created for ${email}.`);
  }
  await mongoose.disconnect();
}

makeAdmin().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
