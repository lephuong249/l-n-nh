import prisma from "../../../prisma/client.js";
import { ServerException, ClientException } from "../../../utils/errors.js";

export class voucherService {
    async create(data) {
        if(await prisma.voucher.findFirst({where:{code: data.code}})) {
            throw new ClientException("Mã voucher đã tồn tại", 400);
        }
        
        const newVoucher = await prisma.voucher.create({
            data: {
                code: data.code,
                name: data.name,
                description: data.description,
                discountType: data.discountType,
                discountValue: data.discountValue,
                minOrderValue: data.minOrderValue,
                maxUsage: data.maxUsage,
                currentUsage: 0,
                isActive: data.isActive,
                startDate: new Date(), // Bắt đầu ngay
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 năm
            }
        });
        return newVoucher;
    }
    
    async update(id, data) {
        const existingVoucher = await prisma.voucher.findUnique({where:{id}});
        if(!existingVoucher) throw new ServerException("Voucher không tồn tại", 404);
        
        if(data.code && data.code !== existingVoucher.code) {
            if(await prisma.voucher.findFirst({where:{code: data.code}})) {
                throw new ClientException("Mã voucher đã tồn tại", 400);
            }
        }
        
        const updatedVoucher = await prisma.voucher.update({
            where: {id},
            data: {
                code: data.code || existingVoucher.code,
                name: data.name || existingVoucher.name,
                description: data.description || existingVoucher.description,
                discountType: data.discountType || existingVoucher.discountType,
                discountValue: data.discountValue || existingVoucher.discountValue,
                minOrderValue: data.minOrderValue || existingVoucher.minOrderValue,
                maxUsage: data.maxUsage || existingVoucher.maxUsage,
                isActive: data.isActive !== undefined ? data.isActive : existingVoucher.isActive
            }
        });
        return updatedVoucher;
    }
    
    async delete(id) {
        const existingVoucher = await prisma.voucher.findUnique({where:{id}});
        if(!existingVoucher) throw new ServerException("Voucher không tồn tại", 404);
        
        await prisma.voucher.delete({where:{id}});
        return {message: "Xóa voucher thành công"};
    }
    
    async getAll(query) {
        const where = query.q ? {
            OR: [
                {code: { contains: query.q, mode: "insensitive" }},
                {name: { contains: query.q, mode: "insensitive" }}
            ]
        } : {};
        
        const vouchers = await prisma.voucher.findMany({
            where,
            skip: query.offset,
            take: query.limit,
            orderBy: { createdAt: "desc" }
        });
        
        const total = await prisma.voucher.count({where});
        const totalPages = Math.ceil(total / query.limit);
        
        return {
            data: vouchers,
            pagination: {
                total,
                totalPages,
                limit: query.limit,
                offset: query.offset,
            }
        };
    }
    
    // Method cho user checkout - lấy voucher khả dụng
    async getAvailableVouchers(orderValue) {
        const vouchers = await prisma.voucher.findMany({
            where: {
                isActive: true,
                minOrderValue: { lte: orderValue },
                currentUsage: { lt: { $expr: { $toObjectId: "$maxUsage" } } } // currentUsage < maxUsage
            },
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                discountType: true,
                discountValue: true,
                minOrderValue: true,
                maxUsage: true,
                currentUsage: true
            },
            orderBy: { discountValue: "desc" }
        });
        
        // Filter trong code để đảm bảo currentUsage < maxUsage
        const availableVouchers = vouchers.filter(voucher => voucher.currentUsage < voucher.maxUsage);
        return availableVouchers;
    }
    
    // Method kiểm tra và tính discount - % cố định
    async applyVoucher(code, orderValue) {
        const voucher = await prisma.voucher.findFirst({
            where: { code: code }
        });
        
        if(!voucher) throw new ClientException("Mã voucher không tồn tại", 400);
        if(!voucher.isActive) throw new ClientException("Voucher không còn hoạt động", 400);
        if(voucher.currentUsage >= voucher.maxUsage) throw new ClientException("Voucher đã hết lượt sử dụng", 400);
        if(orderValue < voucher.minOrderValue) throw new ClientException(`Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString()}đ để sử dụng voucher`, 400);
        
        let discountAmount = 0;
        if(voucher.discountType === "PERCENTAGE") {
            // % cố định - không giới hạn tối đa
            discountAmount = (orderValue * voucher.discountValue) / 100;
        } else if(voucher.discountType === "FIXED") {
            discountAmount = voucher.discountValue;
        }
        
        // Đảm bảo discount không vượt quá giá trị order
        discountAmount = Math.min(discountAmount, orderValue);
        
        return {
            voucher: {
                id: voucher.id,
                code: voucher.code,
                name: voucher.name,
                discountType: voucher.discountType,
                discountValue: voucher.discountValue
            },
            discountAmount: discountAmount,
            finalAmount: orderValue - discountAmount
        };
    }
    
    // Method để confirm sử dụng voucher khi order thành công
    async useVoucher(voucherId) {
        const voucher = await prisma.voucher.findUnique({where: {id: voucherId}});
        if(!voucher) throw new ServerException("Voucher không tồn tại", 404);
        if(voucher.currentUsage >= voucher.maxUsage) throw new ClientException("Voucher đã hết lượt sử dụng", 400);
        
        const updatedVoucher = await prisma.voucher.update({
            where: { id: voucherId },
            data: {
                currentUsage: { increment: 1 }
            }
        });
        
        return updatedVoucher;
    }
    
    // Method lấy thống kê voucher
    async getVoucherStats(id) {
        const voucher = await prisma.voucher.findUnique({
            where: {id},
            select: {
                id: true,
                code: true,
                name: true,
                maxUsage: true,
                currentUsage: true,
                isActive: true,
                orders: {
                    select: {
                        id: true,
                        total: true,
                        createdAt: true
                    }
                }
            }
        });
        
        if(!voucher) throw new ServerException("Voucher không tồn tại", 404);
        
        const remainingUsage = voucher.maxUsage - voucher.currentUsage;
        const usagePercentage = (voucher.currentUsage / voucher.maxUsage) * 100;
        
        return {
            ...voucher,
            remainingUsage,
            usagePercentage: Math.round(usagePercentage),
            totalOrders: voucher.orders.length
        };
    }
}