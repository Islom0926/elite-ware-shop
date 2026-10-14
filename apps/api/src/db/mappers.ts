import type {
  Banner,
  Category,
  Order,
  OrderItem,
  Product,
  SessionUser,
  ShopConfig,
  User,
} from '@tma-shop/shared';
import type { banners, categories, orderItems, orders, products, shops, users } from './schema.js';

type ProductRow = typeof products.$inferSelect;
type CategoryRow = typeof categories.$inferSelect;
type ShopRow = typeof shops.$inferSelect;
type UserRow = typeof users.$inferSelect;
type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;
type BannerRow = typeof banners.$inferSelect;

export function toProductDTO(row: ProductRow): Product {
  return {
    id: row.id,
    shopId: row.shopId,
    categoryId: row.categoryId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price: row.price,
    currency: row.currency,
    imageUrl: row.imageUrl,
    stock: row.stock,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toCategoryDTO(row: CategoryRow): Category {
  return {
    id: row.id,
    shopId: row.shopId,
    slug: row.slug,
    title: row.title,
    sortOrder: row.sortOrder,
  };
}

export function toBannerDTO(row: BannerRow): Banner {
  return {
    id: row.id,
    shopId: row.shopId,
    imageUrl: row.imageUrl,
    productId: row.productId,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toShopConfigDTO(row: ShopRow): ShopConfig {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    currency: row.currency,
    cardNumber: row.cardNumber,
    cardHolder: row.cardHolder,
    paymentInstructions: row.paymentInstructions,
  };
}

export function toSessionUserDTO(row: UserRow): SessionUser {
  return {
    telegramId: row.telegramId,
    firstName: row.firstName,
    lastName: row.lastName,
    username: row.username,
    languageCode: row.languageCode,
    isPremium: row.isPremium,
    photoUrl: row.photoUrl,
    role: row.role,
  };
}

export function toUserDTO(row: UserRow): User {
  return {
    telegramId: row.telegramId,
    firstName: row.firstName,
    lastName: row.lastName,
    username: row.username,
    languageCode: row.languageCode,
    isPremium: row.isPremium,
    photoUrl: row.photoUrl,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toOrderItemDTO(row: OrderItemRow): OrderItem {
  return {
    productId: row.productId,
    title: row.title,
    unitPrice: row.unitPrice,
    quantity: row.quantity,
    subtotal: row.subtotal,
  };
}

export function toOrderDTO(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    shopId: row.shopId,
    userId: row.userId,
    status: row.status,
    items: items.map(toOrderItemDTO),
    total: row.total,
    currency: row.currency,
    confirmedBy: row.confirmedBy,
    receiptImage: row.receiptImage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
