import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu...');

  // 1. Tạo admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      userName: 'Admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      phoneNumber: '0123456789',
    },
  });
  console.log('✅ Tạo admin thành công');

  // 2. Tạo customer user
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      userName: 'Khách hàng',
      email: 'customer@example.com',
      password: customerPassword,
      role: 'CUSTOMER',
      isActive: true,
      phoneNumber: '0987654321',
    },
  });
  console.log('✅ Tạo khách hàng thành công');

  // 3. Tạo payment methods
  await prisma.paymentMethod.createMany({
    data: [
      {
        name: 'Thanh toán khi nhận hàng (COD)',
        type: 'COD',
        description: 'Thanh toán bằng tiền mặt khi nhận hàng',
        isActive: true,
      },
      {
        name: 'Thanh toán VNPay',
        type: 'VNPAY',
        description: 'Thanh toán trực tuyến qua VNPay',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Tạo phương thức thanh toán thành công');

  // 4. Tạo categories và subcategories
  const beautyCategory = await prisma.category.create({
    data: {
      categoryName: 'Sắc đẹp',
      subcategories: {
        create: [
          { subcategoryName: 'Chăm sóc da' },
          { subcategoryName: 'Trang điểm' },
          { subcategoryName: 'Chăm sóc tóc' },
        ],
      },
    },
  });
  console.log('✅ Tạo danh mục sắc đẹp thành công');

  // 5. Tạo vouchers mẫu
  await prisma.voucher.createMany({
    data: [
      {
        code: 'WELCOME10',
        name: 'Chào mừng khách hàng mới',
        description: 'Giảm 10% cho đơn hàng đầu tiên',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderValue: 100000,
        maxDiscount: 50000,
        maxUsage: 100,
        usedCount: 0,
        maxUsagePerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
      },
      {
        code: 'SAVE50K',
        name: 'Giảm 50k',
        description: 'Giảm 50.000đ cho đơn hàng từ 500.000đ',
        discountType: 'FIXED_AMOUNT',
        discountValue: 50000,
        minOrderValue: 500000,
        maxUsage: 50,
        usedCount: 0,
        maxUsagePerUser: 2,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 ngày
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Tạo voucher mẫu thành công');

  // 6. Tạo system settings
  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'site_name',
        value: 'Beauty Box Store',
        description: 'Tên website',
        category: 'general',
      },
      {
        key: 'free_shipping_threshold',
        value: '0',
        description: 'Freeship cho tất cả đơn hàng',
        dataType: 'number',
        category: 'shipping',
      },
      {
        key: 'currency',
        value: 'VND',
        description: 'Đơn vị tiền tệ',
        category: 'general',
      },
      {
        key: 'order_auto_confirm',
        value: 'false',
        description: 'Tự động xác nhận đơn hàng',
        dataType: 'boolean',
        category: 'order',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Tạo cấu hình hệ thống thành công');

  console.log('🎉 Khởi tạo dữ liệu hoàn tất!');
  console.log('📧 Admin: admin@example.com / admin123');
  console.log('📧 Customer: customer@example.com / customer123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Lỗi khởi tạo dữ liệu:', e);
    await prisma.$disconnect();
    process.exit(1);
  });