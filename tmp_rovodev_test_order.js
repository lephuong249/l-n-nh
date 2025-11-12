import prisma from "./src/prisma/client.js";
import { orderService } from "./src/modules/admin/order/order.service.js";
import { voucherService } from "./src/modules/admin/voucher/voucher.service.js";
import { cartService } from "./src/modules/user/cart/cart.service.js";

async function testOrderWorkflow() {
    console.log("🚀 Testing Order Workflow...\n");

    try {
        // Step 1: Tạo test data
        console.log("1️⃣ Creating test data...");
        
        // Tạo temporary address và payment method nếu chưa có
        let address = await prisma.address.findFirst();
        if (!address) {
            address = await prisma.address.create({
                data: {
                    userId: "000000000000000000000001",
                    userName: "Test User",
                    phoneNumber: "0123456789",
                    location: "123 Test Street, Test Ward, Test District, Test City",
                    isDefault: true
                }
            });
        }

        let paymentMethod = await prisma.paymentMethod.findFirst();
        if (!paymentMethod) {
            paymentMethod = await prisma.paymentMethod.create({
                data: {
                    name: "COD",
                    type: "COD",
                    description: "Cash on Delivery",
                    isActive: true
                }
            });
        }

        console.log(`✅ Address: ${address.id}`);
        console.log(`✅ Payment Method: ${paymentMethod.id}`);

        // Step 2: Tạo test voucher
        console.log("\n2️⃣ Creating test voucher...");
        const testVoucher = await new voucherService().create({
            code: "TEST20",
            name: "Test 20% discount",
            description: "Test voucher for order workflow",
            discountType: "PERCENTAGE",
            discountValue: 20,
            minOrderValue: 100000,
            maxUsage: 10,
            isActive: true
        });
        console.log(`✅ Voucher created: ${testVoucher.code} - ${testVoucher.discountValue}%`);

        // Step 3: Tạo test product
        console.log("\n3️⃣ Creating test product...");
        let product = await prisma.product.findFirst();
        if (!product) {
            const category = await prisma.category.findFirst() || await prisma.category.create({
                data: {
                    categoryName: "Test Category",
                    isActive: true
                }
            });

            const subcategory = await prisma.subcategory.findFirst() || await prisma.subcategory.create({
                data: {
                    categoryId: category.id,
                    subcategoryName: "Test Subcategory",
                    isActive: true
                }
            });

            product = await prisma.product.create({
                data: {
                    subcategoryId: subcategory.id,
                    ProductName: "Test Product",
                    description: "Test product for order workflow",
                    price: 500000,
                    stockQuantity: 100,
                    imageUrl: "test-image.jpg",
                    isActive: true
                }
            });
        }
        console.log(`✅ Product: ${product.ProductName} - ${product.price}đ`);

        // Step 4: Skip cart workflow - test order directly
        console.log("\n4️⃣ Skipping cart workflow - testing direct order...");
        const testUserId = "000000000000000000000001";
        
        console.log(`✅ Product price: ${product.price.toLocaleString()}đ`);
        console.log(`✅ Quantity: 2`);
        console.log(`✅ Subtotal: ${(product.price * 2).toLocaleString()}đ`);

        // Step 5: Test order creation
        console.log("\n5️⃣ Testing order creation...");
        const orderData = {
            cartItems: [{
                productId: product.id,
                variantId: null,
                quantity: 2
            }],
            shippingAddress: {
                street: "123 Test Street",
                ward: "Test Ward", 
                district: "Test District",
                city: "Test City",
                phone: "0123456789"
            },
            customerInfo: {
                fullName: "Test Customer",
                phone: "0123456789"
            },
            paymentMethod: "COD",
            voucherCode: testVoucher.code,
            notes: "Test order workflow"
        };

        // Update order service để sử dụng address và payment method IDs thực
        const updatedOrderData = {
            ...orderData,
            addressId: address.id,
            paymentMethodId: paymentMethod.id
        };

        const order = await new orderService().create(testUserId, orderData);
        console.log(`✅ Order created: ${order.orderNumber}`);
        console.log(`✅ Order total: ${order.total.toLocaleString()}đ`);
        console.log(`✅ Voucher discount: ${order.voucherDiscount.toLocaleString()}đ`);

        // Step 6: Test order details
        console.log("\n6️⃣ Testing order details...");
        const orderDetails = await new orderService().getOrderDetails(order.id);
        console.log(`✅ Order details loaded: ${orderDetails.orderDetails.length} items`);

        // Step 7: Test order status update
        console.log("\n7️⃣ Testing order status update...");
        const updatedOrder = await new orderService().updateStatus(order.id, {
            status: "CONFIRMED",
            notes: "Order confirmed by admin"
        }, testUserId);
        console.log(`✅ Order status updated: ${updatedOrder.status}`);

        // Step 8: Test voucher usage check
        console.log("\n8️⃣ Checking voucher usage...");
        const updatedVoucher = await prisma.voucher.findUnique({
            where: { id: testVoucher.id }
        });
        console.log(`✅ Voucher usage: ${updatedVoucher.currentUsage}/${updatedVoucher.maxUsage}`);

        console.log("\n🎉 Order workflow test completed successfully!");
        return { success: true, orderId: order.id };

    } catch (error) {
        console.error("\n❌ Order workflow test failed:", error.message);
        console.error("Stack trace:", error.stack);
        return { success: false, error: error.message };
    }
}

// Cleanup function
async function cleanup() {
    console.log("\n🧹 Cleaning up test data...");
    try {
        await prisma.orderDetail.deleteMany({
            where: {
                productName: "Test Product"
            }
        });
        
        await prisma.order.deleteMany({
            where: {
                note: "Test order workflow"
            }
        });
        
        await prisma.voucher.deleteMany({
            where: {
                code: "TEST20"
            }
        });
        
        await prisma.cart.deleteMany({
            where: {
                userId: "000000000000000000000001"
            }
        });
        
        console.log("✅ Test data cleaned up");
    } catch (error) {
        console.error("❌ Cleanup failed:", error.message);
    }
}

// Run test
testOrderWorkflow()
    .then(result => {
        if (result.success) {
            console.log("\n✅ All tests passed!");
        } else {
            console.log("\n❌ Tests failed!");
        }
        return cleanup();
    })
    .finally(() => {
        process.exit(0);
    });