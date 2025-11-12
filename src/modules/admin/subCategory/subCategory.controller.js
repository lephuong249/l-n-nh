import { successResponse, errorResponse } from "../../../utils/response.js";
import { createDto } from "../category/category.dto.js";
import { subCategoryService } from "../subCategory/subCategory.service.js";

const service = new subCategoryService();

export class subCategoryController {
  /**
   * Tạo danh mục con mới
   * POST /api/categories/:id/subcategories
   */
  async create(req, res, next) {
    try {
      const dto = new createDto(req.body);
      const subcategory = await service.create(dto, req.params.id);
      return successResponse(res, subcategory, "Tạo danh mục con thành công", 201);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  }

  /**
   * Cập nhật danh mục con
   * PUT /api/subcategories/:id
   */
  async update(req, res, next) {
    try {
      const dto = new createDto(req.body);
      const subcategory = await service.update(req.params.id, dto);
      return successResponse(res, subcategory, "Cập nhật danh mục con thành công", 200);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  }

  /**
   * Xóa danh mục con
   * DELETE /api/subcategories/:id
   */
  async delete(req, res, next) {
    try {
      const result = await service.delete(req.params.id);
      return successResponse(res, result, "Xóa danh mục con thành công", 200);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  }

  /**
   * Lấy tất cả categories (cho dropdown)
   * GET /api/categories/list
   */
  async getAllCategory(req, res, next) {
    try {
      const categories = await service.getAllCategory();
      return successResponse(res, categories, "Lấy danh sách danh mục thành công", 200);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  }

  /**
   * Lấy danh sách danh mục con (có pagination + search + filter)
   * GET /api/subcategories?q=...&id=categoryId&limit=10&offset=0
   */
  async getAll(req, res, next) {
    try {
      const query = req.validatedQuery;
      const subcategories = await service.getAll(query);
      return successResponse(res, subcategories, "Lấy danh mục con thành công", 200);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  }
}
