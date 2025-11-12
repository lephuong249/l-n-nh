import { Router } from "express";
import { userOrderController } from "../../../modules/user/userorder/userorder.controller.js";
import { validateQuery, paginationSchema } from "../../../validators/queryValidator.js";

const router = Router();
const controller = new userOrderController();

// User order routes (/uOrder)
router.get("/stats", controller.getUserOrderStats.bind(controller));         // Thống kê đơn hàng user
// Lưu ý: route /:id/track được bỏ vì không có method trackOrder() trong controller
// Nếu cần tracking đơn hàng, sử dụng getOrderDetails() hoặc thêm method mới
router.put("/:id/cancel", controller.cancelOrder.bind(controller));         // Hủy đơn hàng

router.post("/", controller.create.bind(controller));                       // Tạo đơn hàng mới
router.get("/", validateQuery(paginationSchema), controller.getUserOrders.bind(controller)); // Danh sách đơn hàng user
router.get("/:id", controller.getOrderDetails.bind(controller));            // Chi tiết đơn hàng

export default router;