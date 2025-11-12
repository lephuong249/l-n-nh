import { Router } from "express";
import { adminOrderController } from "../../modules/admin/orders/orders.controller.js";
import { validateQuery, paginationSchema } from "../../validators/queryValidator.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();
const controller = new adminOrderController();

// Admin order management routes
router.get("/all", validateQuery(paginationSchema), controller.getAll.bind(controller));           // Lấy tất cả đơn hàng (admin)
router.get("/:id", controller.getOrderDetails.bind(controller));                                   // Chi tiết đơn hàng
router.put("/:id/status", authMiddleware(["Admin"]), controller.updateStatus.bind(controller));    // Cập nhật trạng thái đơn hàng

export default router;