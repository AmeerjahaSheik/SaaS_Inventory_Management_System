const { sequelize, Organization, User, Product, StockLog, StockMovement } = require('./models');

async function seed() {
  console.log('[Seed] Seeding sample data for StockFlow...');

  try {
    await sequelize.authenticate();

    const email = 'demo@stockflow.com';
    let user = await User.findOne({ where: { email } });

    if (user) {
      console.log(`[Seed] Demo account already exists (${email}). Skipping seed.`);
      process.exit(0);
    }

    await sequelize.transaction(async (t) => {
      // 1. Create Organization
      const org = await Organization.create(
        {
          name: 'Apex Tech Solutions',
          default_low_stock_threshold: 10,
        },
        { transaction: t }
      );

      // 2. Create Admin User
      user = await User.create(
        {
          organization_id: org.id,
          name: 'Alex Johnson',
          email,
          password_hash: 'password123',
          role: 'admin',
        },
        { transaction: t }
      );

      // 3. Create Sample Products
      const sampleProducts = [
        {
          name: 'USB-C Multiport Adapter Pro',
          sku: 'HUB-USBC-001',
          category: 'Hardware',
          price: 49.99,
          cost_price: 22.50,
          quantity: 4, // Below default threshold 10
          low_stock_threshold: 10,
          description: '7-in-1 USB-C Hub with 4K HDMI, 100W PD, and SD Card Reader.',
        },
        {
          name: 'Ergonomic Mechanical Keyboard',
          sku: 'KEY-MECH-002',
          category: 'Hardware',
          price: 119.00,
          cost_price: 65.00,
          quantity: 24,
          low_stock_threshold: 8,
          description: 'Tactile mechanical switches with wireless Bluetooth connectivity.',
        },
        {
          name: '4K Ultra-HD Monitor 27"',
          sku: 'MON-4K-003',
          category: 'Displays',
          price: 349.50,
          cost_price: 210.00,
          quantity: 0, // Out of stock
          low_stock_threshold: 5,
          description: 'IPS panel with 99% sRGB color accuracy and USB-C display input.',
        },
        {
          name: 'Wireless Noise-Canceling Headset',
          sku: 'AUD-NC-004',
          category: 'Audio',
          price: 189.99,
          cost_price: 95.00,
          quantity: 6, // Low stock
          low_stock_threshold: 12,
          description: 'Active noise cancellation with 30-hour battery life.',
        },
        {
          name: 'Standing Desk Anti-Fatigue Mat',
          sku: 'MAT-DSK-005',
          category: 'Office',
          price: 39.99,
          cost_price: 14.00,
          quantity: 42,
          low_stock_threshold: 10,
          description: 'High-density foam mat for standing desk comfort.',
        },
        {
          name: 'Thunderbolt 4 Cable (2m)',
          sku: 'CAB-TB4-006',
          category: 'Cables',
          price: 29.99,
          cost_price: 9.50,
          quantity: 68,
          low_stock_threshold: 15,
          description: '40Gbps high-speed data transfer and 240W charging cable.',
        },
        {
          name: 'Aluminum Laptop Riser Stand',
          sku: 'STN-LPT-007',
          category: 'Accessories',
          price: 34.50,
          cost_price: 15.00,
          quantity: 3, // Low stock
          low_stock_threshold: 10,
          description: 'Adjustable ergonomic laptop stand made of premium anodized aluminum.',
        },
        {
          name: 'Microfiber Screen Cleaning Cloths (5-Pack)',
          sku: 'CLN-MCF-008',
          category: 'Supplies',
          price: 12.99,
          cost_price: 3.20,
          quantity: 95,
          low_stock_threshold: 20,
          description: 'Lint-free microfiber cloths safe for all optical screens.',
        },
      ];

      for (const prodData of sampleProducts) {
        const product = await Product.create(
          {
            ...prodData,
            organization_id: org.id,
          },
          { transaction: t }
        );

        // Create an initial stock receipt log and stock movement
        await StockLog.create(
          {
            organization_id: org.id,
            product_id: product.id,
            user_id: user.id,
            type: 'in',
            quantity_change: product.quantity,
            previous_quantity: 0,
            new_quantity: product.quantity,
            reason: 'Initial inventory intake',
          },
          { transaction: t }
        );

        await StockMovement.create(
          {
            organization_id: org.id,
            product_id: product.id,
            movement_type: 'IN',
            quantity: product.quantity,
            previous_quantity: 0,
            new_quantity: product.quantity,
            reason: 'Initial inventory intake & stock verification',
            reference_number: `RCV-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
            created_by: user.id,
          },
          { transaction: t }
        );
      }

      console.log('\n[Seed] Sample data successfully seeded!');
      console.log('==============================================');
      console.log('Demo Login Credentials:');
      console.log(`Email:    ${email}`);
      console.log('Password: password123');
      console.log('Organization: Apex Tech Solutions');
      console.log('==============================================\n');
    });

    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
}

seed();

