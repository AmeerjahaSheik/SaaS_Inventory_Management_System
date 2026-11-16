const {
  sequelize,
  Organization,
  User,
  Product,
  StockLog,
  StockMovement,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
} = require('./models');

async function seed() {
  console.log('[Seed] Seeding sample data for StockFlow...');

  try {
    await sequelize.authenticate();

    const email = 'demo@stockflow.com';
    let user = await User.findOne({ where: { email } });

    let orgId;

    if (!user) {
      await sequelize.transaction(async (t) => {
        // 1. Create Organization
        const org = await Organization.create(
          {
            name: 'Apex Tech Solutions',
            default_low_stock_threshold: 10,
          },
          { transaction: t }
        );
        orgId = org.id;

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
            cost_price: 22.5,
            quantity: 4,
            low_stock_threshold: 10,
            description: '7-in-1 USB-C Hub with 4K HDMI, 100W PD, and SD Card Reader.',
          },
          {
            name: 'Ergonomic Mechanical Keyboard',
            sku: 'KEY-MECH-002',
            category: 'Hardware',
            price: 119.0,
            cost_price: 65.0,
            quantity: 24,
            low_stock_threshold: 8,
            description: 'Tactile mechanical switches with wireless Bluetooth connectivity.',
          },
          {
            name: 'Wireless Noise-Cancelling Headphones',
            sku: 'AUD-NC-003',
            category: 'Audio',
            price: 199.99,
            cost_price: 110.0,
            quantity: 6,
            low_stock_threshold: 12,
            description: 'Over-ear active noise-cancelling with 30-hour battery life.',
          },
          {
            name: 'Ultra-Wide 34-Inch Curved Monitor',
            sku: 'DISP-UW-004',
            category: 'Displays',
            price: 549.0,
            cost_price: 320.0,
            quantity: 15,
            low_stock_threshold: 5,
            description: 'WQHD 144Hz HDR curved gaming and productivity monitor.',
          },
          {
            name: 'Thunderbolt 4 Docking Station',
            sku: 'DOCK-TB4-005',
            category: 'Hardware',
            price: 279.5,
            cost_price: 160.0,
            quantity: 2,
            low_stock_threshold: 10,
            description: 'Dual 4K 60Hz display support with 90W upstream host charging.',
          },
          {
            name: 'Smart Desk Sensor Lamp',
            sku: 'LMP-DSK-006',
            category: 'Accessories',
            price: 39.99,
            cost_price: 18.0,
            quantity: 45,
            low_stock_threshold: 15,
            description: 'Auto-dimming circadian LED desk light with touch controls.',
          },
          {
            name: 'Cat6 Ethernet Cable (10ft, 5-Pack)',
            sku: 'CAB-ETH-007',
            category: 'Cables',
            price: 19.99,
            cost_price: 7.2,
            quantity: 80,
            low_stock_threshold: 20,
            description: 'High-speed gigabit snagless shielded RJ45 patch cables.',
          },
          {
            name: 'High-Speed Precision Barcode Scanner',
            sku: 'SCN-BAR-008',
            category: 'Hardware',
            price: 89.95,
            cost_price: 45.0,
            quantity: 3,
            low_stock_threshold: 8,
            description: 'Wireless 2D QR and barcode scanner with charging cradle.',
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
      });
    } else {
      orgId = user.organization_id;
    }

    // Seed Suppliers if none exist
    const existingSuppliersCount = await Supplier.count({ where: { organization_id: orgId } });
    if (existingSuppliersCount === 0) {
      console.log('[Seed] Seeding sample suppliers for organization...');
      const sampleSuppliers = [
        {
          supplier_name: 'David Vance',
          company_name: 'Apex Semiconductor & Silicon Ltd',
          email: 'orders@apexsemicon.com',
          phone: '+1 (555) 234-5678',
          address: '420 Tech Way, Suite 300, San Jose, CA 95110',
          notes: 'Primary chipset and semiconductor supplier with Net-30 payment terms.',
        },
        {
          supplier_name: 'Sophia Patel',
          company_name: 'Pacific Hardware Distribution Co.',
          email: 'spatel@pacifichardware.net',
          phone: '+1 (555) 876-5432',
          address: '1100 Logistics Blvd, Dock 4B, Seattle, WA 98101',
          notes: 'Fast 2-day delivery on cables, docks, and desktop accessories.',
        },
        {
          supplier_name: 'Marcus Chen',
          company_name: 'NextGen Display Technologies',
          email: 'procurement@nextgendisplays.com',
          phone: '+1 (555) 345-6789',
          address: '88 Innovation Drive, Austin, TX 78701',
          notes: 'Exclusive wholesale manufacturer for ultrawide displays and panels.',
        },
      ];

      for (const s of sampleSuppliers) {
        const createdSupplier = await Supplier.create({
          organization_id: orgId,
          ...s,
        });

        // Seed a sample purchase order for the first supplier
        if (s.supplier_name === 'David Vance') {
          const sampleProd = await Product.findOne({ where: { organization_id: orgId } });
          if (sampleProd) {
            const po = await PurchaseOrder.create({
              organization_id: orgId,
              supplier_id: createdSupplier.id,
              po_number: 'PO-202611-0001',
              status: 'ORDERED',
              order_date: new Date(),
              expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              total_amount: 450.0,
              notes: 'Quarterly restock batch for critical hub adapters.',
              created_by: user.id,
            });

            await PurchaseOrderItem.create({
              purchase_order_id: po.id,
              product_id: sampleProd.id,
              quantity: 20,
              unit_cost: 22.5,
              total_cost: 450.0,
            });
          }
        }
      }
      console.log('[Seed] Sample suppliers and sample PO seeded successfully!');
    }

    console.log('\n[Seed] Sample data verified/ready!');
    console.log('==============================================');
    console.log('Demo Login Credentials:');
    console.log(`Email:    ${email}`);
    console.log('Password: password123');
    console.log('Organization: Apex Tech Solutions');
    console.log('==============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
}

seed();
