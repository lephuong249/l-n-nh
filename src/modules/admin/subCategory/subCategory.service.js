import prisma from "../../../prisma/client.js";
import { ServerException } from "../../../utils/errors.js";

export class subCategoryService {
  /**
   * Helper: Kiểm tra tên danh mục con trùng lặp
   */
  async checkDuplicateName(subcategoryName, excludeId = null) {
    const where = {
      subcategoryName: { contains: subcategoryName, mode: "insensitive" },
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const exists = await prisma.subcategory.findFirst({ where });
    if (exists) {
      throw new ServerException("Danh mục con đã tồn tại", 409);
    }
  }

  /**
   * Tạo danh mục con mới
   */
  async create(data, categoryId) {
    // Check category tồn tại
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new ServerException("Danh mục không tồn tại", 404);
    }

    // Check duplicate name
    await this.checkDuplicateName(data.subcategoryName);

    const newSubCategory = await prisma.subcategory.create({
      data: {
        subcategoryName: data.subcategoryName,
        categoryId: categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            categoryName: true,
          },
        },
      },
    });

    return newSubCategory;
  }

  /**
   * Cập nhật danh mục con
   */
  async update(id, data) {
    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
    });
    if (!subcategory) {
      throw new ServerException("Danh mục con không tồn tại", 404);
    }

    // Chỉ check duplicate nếu tên thay đổi
    if (data.subcategoryName !== subcategory.subcategoryName) {
      await this.checkDuplicateName(data.subcategoryName, id);
    }

    const updatedSubCategory = await prisma.subcategory.update({
      where: { id },
      data: {
        subcategoryName: data.subcategoryName,
      },
      include: {
        category: {
          select: {
            id: true,
            categoryName: true,
          },
        },
      },
    });

    return updatedSubCategory;
  }

  /**
   * Xóa danh mục con
   */
  async delete(id) {
    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!subcategory) {
      throw new ServerException("Danh mục con không tồn tại", 404);
    }

    // Không cho xóa nếu còn products
    if (subcategory.products.length > 0) {
      throw new ServerException(
        `Không thể xóa danh mục con có ${subcategory.products.length} sản phẩm`,
        400
      );
    }

    await prisma.subcategory.delete({ where: { id } });
    return { message: "Xóa danh mục con thành công" };
  }

  /**
   * Lấy tất cả categories (cho dropdown select)
   */
  async getAllCategory() {
    return await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        categoryName: true,
        isActive: true,
      },
      orderBy: { categoryName: "asc" },
    });
  }

  /**
   * Lấy danh sách danh mục con (có pagination + search + filter by category)
   */
  async getAll(query) {
    const where = {};

    // Search by keyword
    if (query.q) {
      where.subcategoryName = { contains: query.q, mode: "insensitive" };
    }

    // Filter by categoryId
    if (query.id) {
      const category = await prisma.category.findUnique({
        where: { id: query.id },
      });
      if (!category) {
        throw new ServerException("Danh mục không tồn tại", 404);
      }
      where.categoryId = query.id;
    }

    // Query song song để tối ưu performance
    const [subcategories, total] = await Promise.all([
      prisma.subcategory.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        include: {
          category: {
            select: {
              id: true,
              categoryName: true,
            },
          },
          _count: {
            select: { products: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subcategory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return {
      data: subcategories,
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