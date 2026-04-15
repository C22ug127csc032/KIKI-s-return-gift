import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import AppSetting from '../models/AppSetting.js';

dotenv.config();

const seedData = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Bootstrap Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kikisstore.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
    });
    console.log('✅ Admin created:', adminEmail);
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // Seed App Settings
  let settings = await AppSetting.findOne();
  if (!settings) {
    await AppSetting.create({
      storeName: process.env.STORE_NAME || "KIKI'S RETURN GIFT STORE",
      whatsappNumber: process.env.STORE_WHATSAPP_NUMBER || '919876543210',
      bankAccountName: process.env.STORE_BANK_ACCOUNT_NAME || "Kiki's Gift Store",
      bankAccountNumber: process.env.STORE_BANK_ACCOUNT_NUMBER || '1234567890',
      bankIFSC: process.env.STORE_BANK_IFSC || 'SBIN0001234',
      upiId: process.env.STORE_UPI_ID || 'kikisstore@upi',
      gstPercentage: 0,
      paymentInstructions: 'Please complete your payment via UPI or bank transfer and share the screenshot on WhatsApp to confirm your order.',
    });
    console.log('✅ App settings created');
  }

  // Seed Categories
  const categoryNames = [
    { name: 'Pooja Items', description: 'Sacred items for religious ceremonies' },
    { name: 'Chocolates & Sweets', description: 'Delicious sweet treats' },
    { name: 'Diyas & Candles', description: 'Beautiful lighting for celebrations' },
    { name: 'Dry Fruits', description: 'Premium quality dry fruits' },
    { name: 'Stationery', description: 'Quality stationery items' },
    { name: 'Home Decor', description: 'Beautiful home decoration items' },
    { name: 'Bags & Pouches', description: 'Decorative bags and pouches' },
    { name: 'Combo Packs', description: 'Value-for-money combo gift packs' },
  ];

  const categories = [];
  for (const cat of categoryNames) {
    const existing = await Category.findOne({ name: cat.name });
    if (!existing) {
      const created = await Category.create(cat);
      categories.push(created);
      console.log(`✅ Category created: ${cat.name}`);
    } else {
      categories.push(existing);
    }
  }

  // Seed Products
  const existingProducts = await Product.countDocuments();
  if (existingProducts === 0) {
    const poojaCategory = categories.find((c) => c.name === 'Pooja Items');
    const chocoCategory = categories.find((c) => c.name === 'Chocolates & Sweets');
    const diyaCategory = categories.find((c) => c.name === 'Diyas & Candles');
    const comboCategory = categories.find((c) => c.name === 'Combo Packs');

    await Product.insertMany([
      {
        name: 'Kumkum & Chandan Set',
        description: 'Premium Kumkum and Chandan set in beautiful packaging, perfect for pooja return gifts.',
        price: 35,
        stock: 200,
        category: poojaCategory._id,
        occasion: 'Pooja',
        featured: true,
        lowStockThreshold: 20,
        sku: 'SKU-001',
      },
      {
        name: 'Assorted Chocolate Box',
        description: 'A delightful assortment of premium chocolates in an elegant gift box.',
        price: 120,
        stock: 150,
        category: chocoCategory._id,
        occasion: 'Birthday',
        featured: true,
        lowStockThreshold: 15,
        sku: 'SKU-002',
      },
      {
        name: 'Hand-painted Diya Set (6)',
        description: 'Beautiful hand-painted clay diyas, set of 6. Perfect for Diwali and festive occasions.',
        price: 80,
        stock: 100,
        category: diyaCategory._id,
        occasion: 'Diwali',
        featured: true,
        lowStockThreshold: 10,
        sku: 'SKU-003',
      },
      {
        name: 'Festive Combo Gift Pack',
        description: 'A premium combo pack with pooja items, chocolates, and diyas — the ultimate return gift.',
        price: 250,
        stock: 75,
        category: comboCategory._id,
        occasion: 'Wedding',
        featured: true,
        lowStockThreshold: 10,
        sku: 'SKU-004',
      },
      {
        name: 'Silver-coated Dry Fruits Box',
        description: 'Premium mixed dry fruits in an elegant silver-coated gift box.',
        price: 199,
        stock: 80,
        category: categories.find((c) => c.name === 'Dry Fruits')._id,
        occasion: 'Anniversary',
        featured: false,
        lowStockThreshold: 10,
        sku: 'SKU-005',
      },
      {
        name: 'Scented Candle Set',
        description: 'Aromatic scented candles in pastel colors, perfect for gifting.',
        price: 150,
        stock: 60,
        category: diyaCategory._id,
        occasion: 'Birthday',
        featured: false,
        lowStockThreshold: 8,
        sku: 'SKU-006',
      },
    ]);
    console.log('✅ Sample products created');
  }

  console.log('\n🎁 Seeding complete!');
  console.log(`Admin: ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
  process.exit(0);
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
