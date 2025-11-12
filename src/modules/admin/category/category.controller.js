import { createDto } from "./category.dto.js";
import { categoryService } from "./category.service.js";
import { successResponse, errorResponse } from "../../../utils/response.js";

const service = new categoryService();

export class categoryController {
  /**
   * Tạo danh mục mới
   * POST /api/categories
   */
  async create(req, res, next) {
    try {
      const dto = new createDto(req.body);
      const category = await service.create(dto);
      return successResponse(res, category, "Tạo danh mục thành công", 201);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  }

  /**
   * Cập nhật danh mục
   * PUT /api/categories/:id
   */
  async update(req, res, next) {
    try {
      const dto = new createDto(req.body);
      const category = await service.update(req.params.id, dto);
      return successResponse(res, category, "Cập nhật danh mục thành công", 200);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  }

  /**
   * Xóa danh mục
   * DELETE /api/categories/:id
   */
  async delete(req, res, next) {
    try {
      const result = await service.delete(req.params.id);
      return successResponse(res, result, "Xóa danh mục thành công", 200);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  }

  /**
   * Lấy danh sách danh mục (có pagination + search)
   * GET /api/categories?q=...&limit=10&offset=0
   */
  async getAll(req, res, next) {
    try {
      const query = req.validatedQuery;
      const categories = await service.getAll(query);
      return successResponse(res, categories, "Lấy danh mục thành công", 200);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  }
}