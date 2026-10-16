import type {
  Banner,
  Category,
  Order,
  OrderItem,
  Product,
  PromoCode,
  RequiredChannel,
  SessionUser,
  ShopConfig,
  User,
} from '@tma-shop/shared';
import type {
  banners,
  categories,
  orderItems,
  orders,
  products,
  promoCodes,
  requiredChannels,
  shops,
  users,
} from './schema.js';

type ProductRow = typeof products.$inferSelect;
type CategoryRow = typeof categories.$inferSelect;
type ShopRow = typeof shops.$inferSelect;
type UserRow = typeof users.$inferSelect;
type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;
type BannerRow = typeof banners.$inferSelect;
type PromoCodeRow = typeof promoCodes.$inferSelect;
type RequiredChannelRow = typeof requiredChannels.$inferSelect;

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
    images: row.images,
    colors: row.colors,
    sizes: row.sizes,
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
    address: row.address,
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
    address: row.address,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toPromoCodeDTO(row: PromoCodeRow): PromoCode {
  return {
    id: row.id,
    shopId: row.shopId,
    code: row.code,
    discountPercent: row.discountPercent,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toOrderItemDTO(row: OrderItemRow): OrderItem {
  return {
    productId: row.productId,
    title: row.title,
    imageUrl: row.imageUrl,
    selectedColor: row.selectedColor,
    selectedSize: row.selectedSize,
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
    promoCode: row.promoCode,
    discountAmount: row.discountAmount,
    confirmedBy: row.confirmedBy,
    receiptImage: row.receiptImage,
    deliveryAddress: row.deliveryAddress,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toRequiredChannelDTO(row: RequiredChannelRow): RequiredChannel {
  return {
    id: row.id,
    shopId: row.shopId,
    username: row.username,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
  };
}
