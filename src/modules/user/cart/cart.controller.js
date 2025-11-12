import { AddToCartDto, UpdateCartItemDto } from "./cart.dto.js";
import { cartService } from "./cart.service.js";
import { successResponse, errorResponse } from "../../../utils/response.js";

const service = new cartService();

export class cartController {
  
  /**
   * Thêm sản phẩm vào giỏ hàng
   * POST /api/cart
   */
  async addToCart(req, res, next) {
    try {
      const userId = req.user.id;
      
      const dto = new AddToCartDto({
        ...req.body,
        userId
      });
      
      dto.validate();

      const cartItem = await service.addToCart(dto);
      
      return successResponse(
        res, 
        cartItem, 
        "Thêm vào giỏ hàng thành công", 
        201
      );
    } catch (error) {
      return errorResponse(
        res, 
        error.message, 
        error.status || 500
      );
    }
  }

  /**
   * Lấy danh sách sản phẩm trong giỏ hàng
   * GET /api/cart
   */
  async getCartItems(req, res, next) {
    try {
      const userId = req.user.id;

      const cart = await service.getCartItems(userId);
      
      return successResponse(
        res, 
        cart, 
        "Lấy giỏ hàng thành công", 
        200
      );
    } catch (error) {
      return errorResponse(
        res, 
        error.message, 
        error.status || 500
      );
    }
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng
   * PUT /api/cart/:id
   */
  async updateCartItem(req, res, next) {
    try {
      const userId = req.user.id;
      const cartDetailId = req.params.id;

      const dto = new UpdateCartItemDto({
        ...req.body,
        userId
      });
      
      dto.validate();

      const updatedItem = await service.updateCartItem(cartDetailId, dto);
      
      return successResponse(
        res, 
        updatedItem, 
        "Cập nhật giỏ hàng thành công", 
        200
      );
    } catch (error) {
      return errorResponse(
        res, 
        error.message, 
        error.status || 500
      );
    }
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng
   * DELETE /api/cart/:id
   */
  async removeCartItem(req, res, next) {
    try {
      const userId = req.user.id;
      const cartDetailId = req.params.id;

      const result = await service.removeCartItem(cartDetailId, userId);
      
      return successResponse(
        res, 
        result, 
        "Xóa sản phẩm khỏi giỏ hàng thành công", 
        200
      );
    } catch (error) {
      return errorResponse(
        res, 
        error.message, 
        error.status || 500
      );
    }
  }

  /**
   * Xóa toàn bộ giỏ hàng
   * DELETE /api/cart
   */
  async clearCart(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await service.clearCart(userId);
      
      return successResponse(
        res, 
        { deletedCount: result.count }, 
        "Xóa toàn bộ giỏ hàng thành công", 
        200
      );
    } catch (error) {
      return errorResponse(
        res, 
        error.message, 
        error.status || 500
      );
    }
  }

  /**
   * Lấy tóm tắt giỏ hàng (tổng tiền, số lượng, etc.)
   * GET /api/cart/summary
   */
  async getCartSummary(req, res, next) {
    try {
      const userId = req.user.id;

      const summary = await service.getCartSummary(userId);
      
      return successResponse(
        res, 
        summary, 
        "Lấy tóm tắt giỏ hàng thành công", 
        200
      );
    } catch (error) {
      return errorResponse(
        res, 
        error.message, 
        error.status || 500
      );
    }
  }

  /**
   * Validate giỏ hàng trước khi checkout
   * GET /api/cart/validate
   */
  async validateCart(req, res, next) {
    try {
      const userId = req.user.id;

      const validation = await service.validateCart(userId);
      
      if (validation.isValid) {
        return successResponse(
          res, 
          validation, 
          "Giỏ hàng hợp lệ", 
          200
        );
      } else {
        return successResponse(
          res, 
          validation, 
          "Giỏ hàng có một số vấn đề", 
          200
        );
      }
    } catch (error) {
      return errorResponse(
        res, 
        error.message, 
        error.status || 500
      );
    }
  }

}