import prisma from "../../../prisma/client.js";
import { ServerException } from "../../../utils/errors.js";

export class categoryService {
  /**
   * Helper: Kiểm tra tên danh mục trùng lặp
   */
  async checkDuplicateName(categoryName, excludeId = null) {
    const where = {
      categoryName: { contains: categoryName, mode: "insensitive" },
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const exists = await prisma.category.findFirst({ where });
    if (exists) {
      throw new ServerException("Danh mục đã tồn tại", 409);
    }
  }

  /**
   * Tạo danh mục mới
   */
  async create(data) {
    await this.checkDuplicateName(data.categoryName);

    const newCategory = await prisma.category.create({
      data: {
        categoryName: data.categoryName,
      },
    });

    return newCategory;
  }

  /**
   * Cập nhật danh mục
   */
  async update(id, data) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new ServerException("Danh mục không tồn tại", 404);
    }

    // Chỉ check duplicate nếu tên thay đổi
    if (data.categoryName !== category.categoryName) {
      await this.checkDuplicateName(data.categoryName, id);
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        categoryName: data.categoryName,
      },
    });

    return updatedCategory;
  }

  /**
   * Xóa danh mục
   */
  async delete(id) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: true,
      },
    });

    if (!category) {
      throw new ServerException("Danh mục không tồn tại", 404);
    }

    // Không cho xóa nếu còn subcategory
    if (category.subcategories.length > 0) {
      throw new ServerException(
        `Không thể xóa danh mục có ${category.subcategories.length} danh mục con`,
        400
      );
    }

    await prisma.category.delete({ where: { id } });
    return { message: "Xóa danh mục thành công" };
  }

  /**
   * Lấy danh sách danh mục (có pagination + search)
   */
  async getAll(query) {
    const where = query.q
      ? { categoryName: { contains: query.q, mode: "insensitive" } }
      : {};

    // Query song song để tối ưu performance
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        include: {
          subcategories: {
            where: { isActive: true },
            select: {
              id: true,
              subcategoryName: true,
              isActive: true,
            },
            orderBy: { subcategoryName: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return {
      data: categories,
      pagination: {
        total,
        totalPages,
        currentPage: Math.floor(query.offset / query.limit) + 1,
        limit: query.limit,
        offset: query.offset,
      },
    };
  }

}