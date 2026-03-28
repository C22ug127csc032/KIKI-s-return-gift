import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import User from './models/User.js';
import AppSetting from './models/AppSetting.js';

const bootstrapAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin',
      });
      console.log(`✅ Admin bootstrapped: ${adminEmail}`);
    }
    const settingsExists = await AppSetting.findOne();
    if (!settingsExists) {
      await AppSetting.create({
        storeName: process.env.STORE_NAME || "KIKI'S RETURN GIFT STORE",
        whatsappNumber: process.env.STORE_WHATSAPP_NUMBER,
        bankAccountName: process.env.STORE_BANK_ACCOUNT_NAME,
        bankAccountNumber: process.env.STORE_BANK_ACCOUNT_NUMBER,
        bankIFSC: process.env.STORE_BANK_IFSC,
        upiId: process.env.STORE_UPI_ID,
      });
      console.log('✅ Default settings initialized');
    }
  } catch (err) {
    console.error('Bootstrap error:', err.message);
  }
};

const startServer = async () => {
  await connectDB();
  await bootstrapAdmin();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 KIKI'S STORE Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
