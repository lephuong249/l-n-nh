import { Router } from "express";
import { cartController } from "../../../modules/user/cart/cart.controller.js";

const router=Router();
const controller = new cartController();

// Cart management routes
router.get("/summary", controller.getCartSummary.bind(controller));  // Tóm tắt giỏ hàng
router.get("/validate", controller.validateCart.bind(controller));   // Validate trước checkout

router.post("/", controller.addToCart.bind(controller));              // Thêm vào giỏ hàng
router.get("/", controller.getCartItems.bind(controller));           // Lấy giỏ hàng
router.put("/:id", controller.updateCartItem.bind(controller));      // Cập nhật số lượng
router.delete("/:id", controller.removeCartItem.bind(controller));   // Xóa 1 item
router.delete("/", controller.clearCart.bind(controller));           // Xóa toàn bộ

export default router;