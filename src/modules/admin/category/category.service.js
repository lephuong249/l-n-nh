import prisma from "../../../prisma/client.js"; 
import { ServerException } from "../../../utils/errors.js";

export class categoryService {
    async create(data) {
        const searchName = data.categoryName || data.name;
        const existingCategory = await prisma.category.findFirst({ 
            where: { categoryName: { contains: searchName, mode: "insensitive" } } 
          });
          if (existingCategory) throw new ServerException("Danh mục đã tồn tại", 409);
          const newCategory = await prisma.category.create({
            data: {
              categoryName: searchName,
            }
          });
          return newCategory;
    }
    async update(id, data) {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw new ServerException("Danh mục không tồn tại", 404);
        const newName = data.categoryName || data.name;
        if (newName && newName !== category.categoryName) {
          const existingCategory = await prisma.category.count({ 
            where: { categoryName: { contains: newName, mode: "insensitive" } } 
          });
          if (existingCategory>0) throw new ServerException("Danh mục đã tồn tại", 409);
        }
        const updatedCategory = await prisma.category.update({
          where: { id },
          data: {
            categoryName: newName || category.categoryName,          }
        });
        return updatedCategory;
        }
    async delete(id) {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw new ServerException("Danh mục không tồn tại", 404);
        await prisma.category.delete({ where: { id } });
        return { message: "Xóa danh mục thành công" };
    }
    async getAll(query) {
        const where=query.q ? { categoryName: { contains: query.q, mode: "insensitive" }} : {};
        const categories = await prisma.category.findMany({
          where,
          skip: query.offset,
          take: query.limit,
        });
        const total= await prisma.category.count(
          {where}
        );
        const totalPages = Math.ceil(total/ query.limit);
        return {
          data: categories,
          pagination: {
            total,
            totalPages,
            limit: query.limit,
            offset: query.offset,
          },
        };
    }
}
