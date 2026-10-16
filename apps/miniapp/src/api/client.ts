import type {
  AuthResponse,
  Banner,
  BannerInput,
  Cart,
  CatalogQuery,
  Category,
  CreateOrderResponse,
  Order,
  PromoCode,
  PromoCodeInput,
  PromoPreview,
  Product,
  ProductInput,
  RankInfo,
  RequiredChannel,
  RequiredChannelInput,
  ShopConfig,
  ShopStats,
  UpdateShopSettingsRequest,
  User,
  UserRole,
} from '@tma-shop/shared';

export interface ProductPage {
  items: Product[];
  page: number;
  limit: number;
  total: number;
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null): void {
    this.token = token;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body) headers.set('Content-Type', 'application/json');
    if (this.token) headers.set('Authorization', `Bearer ${this.token}`);

    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    if (res.status === 204) return undefined as T;

    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
      throw new ApiClientError(res.status, err?.code ?? 'error', err?.message ?? res.statusText);
    }
    return data as T;
  }

  // --- auth ---
  auth(initData: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
  }

  // --- catalog ---
  getShop(): Promise<ShopConfig> {
    return this.request<ShopConfig>('/shop');
  }

  getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories');
  }

  getBanners(): Promise<Banner[]> {
    return this.request<Banner[]>('/banners');
  }

  getProducts(query: Partial<CatalogQuery> = {}): Promise<ProductPage> {
    const params = new URLSearchParams();
    if (query.categoryId) params.set('categoryId', query.categoryId);
    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.request<ProductPage>(`/products${qs ? `?${qs}` : ''}`);
  }

  getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  // --- cart ---
  getCart(): Promise<Cart> {
    return this.request<Cart>('/cart');
  }

  addToCart(
    productId: string,
    quantity: number,
    selectedColor?: string | null,
    selectedSize?: string | null,
  ): Promise<Cart> {
    return this.request<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, selectedColor, selectedSize }),
    });
  }

  setCartItem(
    productId: string,
    quantity: number,
    selectedColor?: string | null,
    selectedSize?: string | null,
  ): Promise<Cart> {
    return this.request<Cart>(`/cart/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, selectedColor, selectedSize }),
    });
  }

  removeCartItem(
    productId: string,
    selectedColor?: string | null,
    selectedSize?: string | null,
  ): Promise<Cart> {
    const params = new URLSearchParams();
    if (selectedColor) params.set('color', selectedColor);
    if (selectedSize) params.set('size', selectedSize);
    const qs = params.toString();
    return this.request<Cart>(`/cart/items/${productId}${qs ? `?${qs}` : ''}`, {
      method: 'DELETE',
    });
  }

  // --- orders & payment ---
  createOrder(promoCode?: string): Promise<CreateOrderResponse> {
    return this.request<CreateOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(promoCode ? { promoCode } : {}),
    });
  }

  previewPromoCode(code: string): Promise<PromoPreview> {
    return this.request<PromoPreview>('/orders/promo-preview', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders');
  }

  getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  submitReceipt(orderId: string, imageData: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/receipt`, {
      method: 'POST',
      body: JSON.stringify({ imageData }),
    });
  }

  // --- admin ---
  adminGetOrders(): Promise<Order[]> {
    return this.request<Order[]>('/admin/orders');
  }

  adminUpdateShop(input: UpdateShopSettingsRequest): Promise<ShopConfig> {
    return this.request<ShopConfig>('/admin/shop', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  adminSetOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    return this.request<Order>(`/admin/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  adminCreateProduct(input: ProductInput): Promise<Product> {
    return this.request<Product>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  adminListUsers(): Promise<User[]> {
    return this.request<User[]>('/admin/users');
  }

  adminSetUserRole(telegramId: number, role: UserRole): Promise<User> {
    return this.request<User>(`/admin/users/${telegramId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  adminCreateBanner(input: BannerInput): Promise<Banner> {
    return this.request<Banner>('/admin/banners', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  adminDeleteBanner(id: string): Promise<void> {
    return this.request<void>(`/admin/banners/${id}`, { method: 'DELETE' });
  }

  adminListProducts(): Promise<Product[]> {
    return this.request<Product[]>('/admin/products');
  }

  adminUpdateProduct(id: string, input: ProductInput): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  adminDeleteProduct(id: string): Promise<void> {
    return this.request<void>(`/admin/products/${id}`, { method: 'DELETE' });
  }

  adminCreateCategory(input: {
    slug: string;
    title: string;
    sortOrder: number;
  }): Promise<Category> {
    return this.request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  adminUpdateCategory(
    id: string,
    input: { slug: string; title: string; sortOrder: number },
  ): Promise<Category> {
    return this.request<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  adminDeleteCategory(id: string): Promise<void> {
    return this.request<void>(`/admin/categories/${id}`, { method: 'DELETE' });
  }

  adminListPromoCodes(): Promise<PromoCode[]> {
    return this.request<PromoCode[]>('/admin/promo-codes');
  }

  adminCreatePromoCode(input: PromoCodeInput): Promise<PromoCode> {
    return this.request<PromoCode>('/admin/promo-codes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  adminDeletePromoCode(id: string): Promise<void> {
    return this.request<void>(`/admin/promo-codes/${id}`, { method: 'DELETE' });
  }

  adminListChannels(): Promise<RequiredChannel[]> {
    return this.request<RequiredChannel[]>('/admin/channels');
  }

  adminCreateChannel(input: RequiredChannelInput): Promise<RequiredChannel> {
    return this.request<RequiredChannel>('/admin/channels', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  adminDeleteChannel(id: string): Promise<void> {
    return this.request<void>(`/admin/channels/${id}`, { method: 'DELETE' });
  }

  adminGetStats(): Promise<ShopStats> {
    return this.request<ShopStats>('/admin/stats');
  }

  // --- profile ---
  getProfile(): Promise<User> {
    return this.request<User>('/profile');
  }

  updateAddress(address: string | null): Promise<User> {
    return this.request<User>('/profile/address', {
      method: 'PATCH',
      body: JSON.stringify({ address }),
    });
  }

  getRank(): Promise<RankInfo> {
    return this.request<RankInfo>('/profile/rank');
  }
}

export const api = new ApiClient();
