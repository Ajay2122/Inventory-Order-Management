const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const userData = [
  { name: 'Admin User',    email: 'admin@inventory.com',   password: 'Admin@123',   role: 'admin' },
  { name: 'Store Manager', email: 'manager@inventory.com', password: 'Manager@123', role: 'manager' },
  { name: 'Viewer User',   email: 'viewer@inventory.com',  password: 'Viewer@123',  role: 'viewer' },
];

const products = [
  { name: 'Wireless Keyboard',  sku: 'ELEC-WK-001',  category: 'Electronics',     price: 49.99,  stock: 50,  reorderLevel: 10 },
  { name: 'USB-C Hub 7-in-1',   sku: 'ELEC-HUB-002', category: 'Electronics',     price: 34.99,  stock: 8,   reorderLevel: 10 },
  { name: 'Ergonomic Mouse',    sku: 'ELEC-EM-003',  category: 'Electronics',     price: 29.99,  stock: 75,  reorderLevel: 15 },
  { name: 'Laptop Stand',       sku: 'FURN-LS-001',  category: 'Furniture',       price: 59.99,  stock: 30,  reorderLevel: 5  },
  { name: 'Office Chair',       sku: 'FURN-OC-002',  category: 'Furniture',       price: 299.99, stock: 12,  reorderLevel: 5  },
  { name: 'Standing Desk',      sku: 'FURN-SD-003',  category: 'Furniture',       price: 499.99, stock: 3,   reorderLevel: 5  },
  { name: 'Blue T-Shirt (M)',   sku: 'CLTH-BT-001',  category: 'Clothing',        price: 19.99,  stock: 100, reorderLevel: 20 },
  { name: 'Running Shoes',      sku: 'CLTH-RS-002',  category: 'Clothing',        price: 89.99,  stock: 45,  reorderLevel: 10 },
  { name: 'Notebook A5 Pack',   sku: 'STAT-NB-001',  category: 'Stationery',      price: 12.99,  stock: 5,   reorderLevel: 20 },
  { name: 'Premium Pens Set',   sku: 'STAT-PS-002',  category: 'Stationery',      price: 24.99,  stock: 60,  reorderLevel: 15 },
  { name: 'Protein Powder',     sku: 'FOOD-PP-001',  category: 'Food & Beverages',price: 54.99,  stock: 25,  reorderLevel: 10 },
  { name: 'Cordless Drill',     sku: 'TOOL-CD-001',  category: 'Tools',           price: 79.99,  stock: 2,   reorderLevel: 5  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany()]);
    console.log('Cleared existing data');

    // Create users ONE BY ONE so the pre-save hook (password hashing) fires for each
    const createdUsers = [];
    for (const u of userData) {
      const user = await new User(u).save();
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users`);

    // Verify passwords actually got hashed by testing bcrypt.compare
    const bcrypt = require('bcryptjs');
    for (const u of userData) {
      const dbUser = await User.findOne({ email: u.email }).select('+password');
      const ok = await bcrypt.compare(u.password, dbUser.password);
      console.log(`  Password check [${u.role}]: ${ok ? '✓ PASS' : '✗ FAIL — hash missing!'}`);
    }

    const createdProducts = await Product.create(products);
    console.log(`\nCreated ${createdProducts.length} products`);

    const sampleOrders = [
      {
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        items: [
          { productId: createdProducts[0]._id, quantity: 2, price: createdProducts[0].price },
          { productId: createdProducts[2]._id, quantity: 1, price: createdProducts[2].price },
        ],
        totalAmount: createdProducts[0].price * 2 + createdProducts[2].price,
        status: 'Confirmed',
      },
      {
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        items: [{ productId: createdProducts[1]._id, quantity: 1, price: createdProducts[1].price }],
        totalAmount: createdProducts[1].price,
        status: 'Pending',
      },
    ];
    const createdOrders = await Order.create(sampleOrders);
    console.log(`Created ${createdOrders.length} orders`);

    console.log('\n=== Seed Complete ===');
    console.log('Admin:   admin@inventory.com   / Admin@123');
    console.log('Manager: manager@inventory.com / Manager@123');
    console.log('Viewer:  viewer@inventory.com  / Viewer@123');
    console.log('===================\n');

    process.exit(0);
  } catch (err) {
    console.error('\nSeed failed:', err.message);
    process.exit(1);
  }
};

seed();
