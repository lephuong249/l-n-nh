import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class cartService {
  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  async addToCart(dto) {
    try {
      // Kiểm tra product variant có tồn tại không
      const productVariant = await prisma.productVariant.findUnique({
        where: { id: dto.productVariantId },
        include: {
          product: {
            select: {
              name: true,
              isActive: true
            }
          }
        }
      });

      if (!productVariant) {
        throw new Error("Sản phẩm không tồn tại");
      }

      if (!productVariant.product.isActive) {
        throw new Error("Sản phẩm đã ngừng kinh doanh");
      }

      if (productVariant.stock < dto.quantity) {
        throw new Error("Không đủ hàng trong kho");
      }

      // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
      const existingCartItem = await prisma.cart.findFirst({
        where: {
          userId: dto.userId,
          productVariantId: dto.productVariantId
        }
      });

      if (existingCartItem) {
        // Cập nhật số lượng
        const newQuantity = existingCartItem.quantity + dto.quantity;
        
        if (newQuantity > productVariant.stock) {
          throw new Error("Không đủ hàng trong kho");
        }

        return await prisma.cart.update({
          where: { id: existingCartItem.id },
          data: { quantity: newQuantity },
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    name: true,
                    imageUrl: true
                  }
                }
              }
            }
          }
        });
      } else {
        // Tạo mới cart item
        return await prisma.cart.create({
          data: {
            userId: dto.userId,
            productVariantId: dto.productVariantId,
            quantity: dto.quantity
          },
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    name: true,
                    imageUrl: true
                  }
                }
              }
            }
          }
        });
      }
    } catch (error) {
      throw new Error(`Lỗi khi thêm vào giỏ hàng: ${error.message}`);
    }
  }

  /**
   * Lấy giỏ hàng của user
   */
  async getCartItems(userId) {
    try {
      const cartItems = await prisma.cart.findMany({
        where: { userId },
        include: {
          productVariant: {
            include: {
              product: {
                select: {
                  name: true,
                  imageUrl: true,
                  isActive: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Tính tổng tiền
      const totalAmount = cartItems.reduce((total, item) => {
        return total + (item.productVariant.price * item.quantity);
      }, 0);

      const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

      return {
        items: cartItems,
        summary: {
          totalItems,
          totalAmount,
          itemCount: cartItems.length
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy giỏ hàng: ${error.message}`);
    }
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng
   */
  async updateCartItem(cartItemId, dto) {
    try {
      // Kiểm tra cart item có tồn tại và thuộc về user không
      const cartItem = await prisma.cart.findFirst({
        where: {
          id: cartItemId,
          userId: dto.userId
        },
        include: {
          productVariant: true
        }
      });

      if (!cartItem) {
        throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
      }

      // Kiểm tra stock
      if (cartItem.productVariant.stock < dto.quantity) {
        throw new Error("Không đủ hàng trong kho");
      }

      return await prisma.cart.update({
        where: { id: cartItemId },
        data: { quantity: dto.quantity },
        include: {
          productVariant: {
            include: {
              product: {
                select: {
                  name: true,
                  imageUrl: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật giỏ hàng: ${error.message}`);
    }
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng
   */
  async removeCartItem(cartItemId, userId) {
    try {
      // Kiểm tra cart item có tồn tại và thuộc về user không
      const cartItem = await prisma.cart.findFirst({
        where: {
          id: cartItemId,
          userId: userId
        }
      });

      if (!cartItem) {
        throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
      }

      return await prisma.cart.delete({
        where: { id: cartItemId }
      });
    } catch (error) {
      throw new Error(`Lỗi khi xóa sản phẩm: ${error.message}`);
    }
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  async clearCart(userId) {
    try {
      return await prisma.cart.deleteMany({
        where: { userId }
      });
    } catch (error) {
      throw new Error(`Lỗi khi xóa giỏ hàng: ${error.message}`);
    }
  }

  /**
   * Lấy tóm tắt giỏ hàng
   */
  async getCartSummary(userId) {
    try {
      const cartItems = await prisma.cart.findMany({
        where: { userId },
        include: {
          productVariant: {
            select: {
              price: true,
              stock: true
            }
          }
        }
      });

      const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
      const totalAmount = cartItems.reduce((total, item) => {
        return total + (item.productVariant.price * item.quantity);
      }, 0);

      // Kiểm tra tình trạng stock
      const outOfStockItems = cartItems.filter(item => 
        item.productVariant.stock < item.quantity
      );

      return {
        totalItems,
        totalAmount,
        itemCount: cartItems.length,
        hasOutOfStockItems: outOfStockItems.length > 0,
        outOfStockItems: outOfStockItems.map(item => ({
          id: item.id,
          requestedQuantity: item.quantity,
          availableStock: item.productVariant.stock
        }))
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy tóm tắt giỏ hàng: ${error.message}`);
    }
  }

  /**
   * Validate giỏ hàng trước khi checkout
   */
  async validateCart(userId) {
    try {
      const cartItems = await prisma.cart.findMany({
        where: { userId },
        include: {
          productVariant: {
            include: {
              product: {
                select: {
                  name: true,
                  isActive: true
                }
              }
            }
          }
        }
      });

      if (cartItems.length === 0) {
        throw new Error("Giỏ hàng trống");
      }

      const issues = [];

      cartItems.forEach(item => {
        // Kiểm tra sản phẩm còn active không
        if (!item.productVariant.product.isActive) {
          issues.push({
            type: "PRODUCT_INACTIVE",
            itemId: item.id,
            message: `Sản phẩm ${item.productVariant.product.name} đã ngừng kinh doanh`
          });
        }

        // Kiểm tra stock
        if (item.productVariant.stock < item.quantity) {
          issues.push({
            type: "INSUFFICIENT_STOCK",
            itemId: item.id,
            message: `Sản phẩm ${item.productVariant.product.name} chỉ còn ${item.productVariant.stock} sản phẩm`,
            availableStock: item.productVariant.stock,
            requestedQuantity: item.quantity
          });
        }
      });

      return {
        isValid: issues.length === 0,
        issues,
        totalAmount: cartItems.reduce((total, item) => {
          return total + (item.productVariant.price * item.quantity);
        }, 0)
      };
    } catch (error) {
      throw new Error(`Lỗi khi validate giỏ hàng: ${error.message}`);
    }
  }

}