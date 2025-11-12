import express from "express";
import { voucherController } from "../../modules/admin/voucher/voucher.controller.js";

const router = express.Router();
const controller = new voucherController();

// Routes cho user sử dụng voucher
// Lưu ý: router này được mount chung với auth middleware ở `app.js` => không cần khai báo authMiddleware tại route này
router.get("/available", controller.getAvailableVouchers.bind(controller));    // Lấy voucher khả dụng
router.post("/apply", controller.applyVoucher.bind(controller));               // Áp dụng voucher
router.post("/validate/:code", controller.validateVoucher.bind(controller));  // Validate voucher

export default router;