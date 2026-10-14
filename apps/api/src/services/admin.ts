import { and, desc, eq } from 'drizzle-orm';
import type { Banner, BannerInput, Category, Product, ProductInput } from '@tma-shop/shared';
import type { Database } from '../db/client.js';
import { banners, categories, products } from '../db/schema.js';
import { toBannerDTO, toCategoryDTO, toProductDTO } from '../db/mappers.js';
import { ApiError } from '../lib/errors.js';

/** Lists every product (including inactive ones), for the admin product manager. */
export async function listAdminProducts(db: Database, shopId: string): Promise<Product[]> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.shopId, shopId))
    .orderBy(desc(products.createdAt));
  return rows.map(toProductDTO);
}

export async function createProduct(
  db: Database,
  shopId: string,
  input: ProductInput,
): Promise<Product> {
  const [row] = await db
    .insert(products)
    .values({ shopId, ...input })
    .returning();
  if (!row) throw new Error('Failed to create product');
  return toProductDTO(row);
}

export async function updateProduct(
  db: Database,
  shopId: string,
  productId: string,
  input: ProductInput,
): Promise<Product> {
  const [row] = await db
    .update(products)
    .set({ ...input })
    .where(and(eq(products.shopId, shopId), eq(products.id, productId)))
    .returning();
  if (!row) throw ApiError.notFound('Product not found');
  return toProductDTO(row);
}

export async function deleteProduct(
  db: Database,
  shopId: string,
  productId: string,
): Promise<void> {
  const deleted = await db
    .delete(products)
    .where(and(eq(products.shopId, shopId), eq(products.id, productId)))
    .returning({ id: products.id });
  if (deleted.length === 0) throw ApiError.notFound('Product not found');
}

export async function createCategory(
  db: Database,
  shopId: string,
  input: { slug: string; title: string; sortOrder: number },
): Promise<Category> {
  const [row] = await db
    .insert(categories)
    .values({ shopId, ...input })
    .returning();
  if (!row) throw new Error('Failed to create category');
  return toCategoryDTO(row);
}

export async function updateCategory(
  db: Database,
  shopId: string,
  categoryId: string,
  input: { slug: string; title: string; sortOrder: number },
): Promise<Category> {
  const [row] = await db
    .update(categories)
    .set({ ...input })
    .where(and(eq(categories.shopId, shopId), eq(categories.id, categoryId)))
    .returning();
  if (!row) throw ApiError.notFound('Category not found');
  return toCategoryDTO(row);
}

export async function deleteCategory(
  db: Database,
  shopId: string,
  categoryId: string,
): Promise<void> {
  const deleted = await db
    .delete(categories)
    .where(and(eq(categories.shopId, shopId), eq(categories.id, categoryId)))
    .returning({ id: categories.id });
  if (deleted.length === 0) throw ApiError.notFound('Category not found');
}

export async function createBanner(
  db: Database,
  shopId: string,
  input: BannerInput,
): Promise<Banner> {
  if (input.productId) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, input.productId), eq(products.shopId, shopId)),
    });
    if (!product) throw ApiError.badRequest('product_not_found', 'Linked product not found');
  }
  const [row] = await db
    .insert(banners)
    .values({ shopId, ...input })
    .returning();
  if (!row) throw new Error('Failed to create banner');
  return toBannerDTO(row);
}

export async function deleteBanner(db: Database, shopId: string, bannerId: string): Promise<void> {
  const deleted = await db
    .delete(banners)
    .where(and(eq(banners.shopId, shopId), eq(banners.id, bannerId)))
    .returning({ id: banners.id });
  if (deleted.length === 0) throw ApiError.notFound('Banner not found');
}
