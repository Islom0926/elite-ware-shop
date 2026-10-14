import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);

/**
 * `fulfilled` is retained (but unused by new code) rather than removed, to
 * avoid a risky enum-recreation migration; the post-payment pipeline now
 * runs pending -> ... -> paid -> accepted -> in_delivery -> at_warehouse ->
 * shipped (terminal), or cancelled at any point before shipped.
 */
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'awaiting_payment',
  'paid',
  'cancelled',
  'fulfilled',
  'accepted',
  'in_delivery',
  'at_warehouse',
  'shipped',
]);

export interface ProductColor {
  name: string;
  imageUrl: string | null;
}

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  currency: text('currency').notNull().default('UZS'),
  /** Bank card number customers transfer manual payments to. */
  cardNumber: text('card_number'),
  /** Name on the bank card, shown to customers alongside the number. */
  cardHolder: text('card_holder'),
  /** Free-form instructions shown at checkout (e.g. "send receipt here"). */
  paymentInstructions: text('payment_instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [unique('categories_shop_slug_unique').on(table.shopId, table.slug)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    /** Price in the currency's minor units (whole Stars for XTR). */
    price: integer('price').notNull(),
    currency: text('currency').notNull(),
    imageUrl: text('image_url'),
    /** Extra gallery images (data URLs), shown alongside the cover `imageUrl`. */
    images: jsonb('images').$type<string[]>().notNull().default([]),
    /** Selectable colors, each optionally with its own preview image. */
    colors: jsonb('colors').$type<ProductColor[]>().notNull().default([]),
    /** Selectable sizes (e.g. "S", "41"), shown as chips. */
    sizes: jsonb('sizes').$type<string[]>().notNull().default([]),
    /** NULL means the product is not stock-tracked. */
    stock: integer('stock'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('products_shop_slug_unique').on(table.shopId, table.slug)],
);

export const banners = pgTable('banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  /** Banner artwork, stored as a data URL (base64 image). */
  imageUrl: text('image_url').notNull(),
  /** Optional product the banner links to when tapped. */
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  telegramId: bigint('telegram_id', { mode: 'number' }).primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  username: text('username'),
  languageCode: text('language_code'),
  isPremium: boolean('is_premium').notNull().default(false),
  photoUrl: text('photo_url'),
  role: userRoleEnum('role').notNull().default('customer'),
  /** Delivery address the customer entered in their profile. */
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const promoCodes = pgTable(
  'promo_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    discountPercent: integer('discount_percent').notNull(),
    /** NULL means unlimited uses. */
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('promo_codes_shop_code_unique').on(table.shopId, table.code)],
);

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.telegramId, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('carts_shop_user_unique').on(table.shopId, table.userId)],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    /**
     * Empty string (not NULL) when the product has no selectable color/size,
     * so the uniqueness constraint below still de-dupes plain add-to-cart
     * calls — Postgres treats NULL as distinct from NULL in unique indexes.
     */
    selectedColor: text('selected_color').notNull().default(''),
    selectedSize: text('selected_size').notNull().default(''),
  },
  (table) => [
    unique('cart_items_cart_product_variant_unique').on(
      table.cartId,
      table.productId,
      table.selectedColor,
      table.selectedSize,
    ),
  ],
);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.telegramId, { onDelete: 'cascade' }),
  status: orderStatusEnum('status').notNull().default('pending'),
  /** Final charged amount, after any promo code discount. */
  total: integer('total').notNull(),
  currency: text('currency').notNull(),
  /** Promo code applied at checkout, if any. */
  promoCode: text('promo_code'),
  /** Amount deducted from the items subtotal by the promo code. */
  discountAmount: integer('discount_amount').notNull().default(0),
  /** Telegram id of the admin who confirmed the manual payment. */
  confirmedBy: bigint('confirmed_by', { mode: 'number' }),
  /** Customer-submitted payment proof, stored as a data URL (base64 image). */
  receiptImage: text('receipt_image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  imageUrl: text('image_url'),
  /** Snapshots of the variant picked at checkout, if the product had any. */
  selectedColor: text('selected_color'),
  selectedSize: text('selected_size'),
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: integer('subtotal').notNull(),
});

// --- relations (used by Drizzle's relational query API) ---

export const shopsRelations = relations(shops, ({ many }) => ({
  categories: many(categories),
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  shop: one(shops, { fields: [categories.shopId], references: [shops.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  shop: one(shops, { fields: [products.shopId], references: [shops.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const bannersRelations = relations(banners, ({ one }) => ({
  shop: one(shops, { fields: [banners.shopId], references: [shops.id] }),
  product: one(products, { fields: [banners.productId], references: [products.id] }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.telegramId] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.telegramId] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
