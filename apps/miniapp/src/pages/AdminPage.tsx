import { useRef, useState } from 'react';
import { Badge, Button, Cell, Input, List, Section, Textarea } from '@telegram-apps/telegram-ui';
import type {
  Banner,
  Category,
  OrderStatus,
  Product,
  ProductInput,
  PromoCode,
  ShopConfig,
} from '@tma-shop/shared';
import { api, ApiClientError } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSession } from '../providers/SessionProvider.js';
import { formatPrice } from '../lib/format.js';
import { fileToCompressedDataUrl } from '../lib/image.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { useLang } from '../i18n/LanguageProvider.js';
import type { Dictionary } from '../i18n/translations.js';

const STATUS_LABEL_KEY: Record<OrderStatus, keyof Dictionary> = {
  pending: 'statusPending',
  awaiting_payment: 'statusAwaitingPayment',
  paid: 'statusPaid',
  cancelled: 'statusCancelled',
  fulfilled: 'statusFulfilled',
};

export function AdminPage(): React.JSX.Element {
  const { isAdmin, user } = useSession();
  const { t } = useLang();
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);

  const shop = useAsync(() => api.getShop(), [reloadKey]);
  const orders = useAsync(() => api.adminGetOrders(), [reloadKey]);

  if (!isAdmin) return <ErrorView message={t('adminsOnly')} />;

  const setStatus = async (id: string, status: OrderStatus): Promise<void> => {
    await api.adminSetOrderStatus(id, status);
    reload();
  };

  return (
    <List>
      <ShopSettingsForm shop={shop.data} onSaved={reload} />
      <BannersManager />
      <CategoriesManager />
      <NewProductForm currency={shop.data?.currency ?? 'UZS'} onCreated={reload} />
      <ProductsManager currency={shop.data?.currency ?? 'UZS'} />
      <PromoCodesManager />

      <Section header={t('allOrders')}>
        {orders.loading && <Loader />}
        {orders.error && <ErrorView message={orders.error} />}
        {orders.data?.length === 0 && <Cell>{t('noOrders')}</Cell>}
        {orders.data?.map((order) => (
          <Cell
            key={order.id}
            subtitle={`${t(STATUS_LABEL_KEY[order.status])} · ${formatPrice(order.total, order.currency)}`}
            description={
              order.receiptImage ? (
                <div style={{ marginTop: 6 }}>
                  <a href={order.receiptImage} target="_blank" rel="noreferrer">
                    <img
                      src={order.receiptImage}
                      alt={t('receiptLabel')}
                      style={{ maxWidth: 120, borderRadius: 8, display: 'block' }}
                    />
                  </a>
                </div>
              ) : undefined
            }
            after={
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {order.status === 'awaiting_payment' && (
                  <Button size="s" mode="filled" onClick={() => void setStatus(order.id, 'paid')}>
                    {t('confirmPayment')}
                  </Button>
                )}
                {order.status === 'paid' && (
                  <Button
                    size="s"
                    mode="bezeled"
                    onClick={() => void setStatus(order.id, 'fulfilled')}
                  >
                    {t('fulfill')}
                  </Button>
                )}
                {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                  <Button
                    size="s"
                    mode="plain"
                    onClick={() => void setStatus(order.id, 'cancelled')}
                  >
                    {t('cancel')}
                  </Button>
                )}
              </div>
            }
            multiline
          >
            #{order.id.slice(0, 8)}
          </Cell>
        ))}
      </Section>

      <AdminsManager selfTelegramId={user?.telegramId ?? null} />
    </List>
  );
}

function AdminsManager({ selfTelegramId }: { selfTelegramId: number | null }): React.JSX.Element {
  const { t } = useLang();
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);
  const users = useAsync(() => api.adminListUsers(), [reloadKey]);
  const [promoteId, setPromoteId] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const changeRole = async (telegramId: number, role: 'admin' | 'customer'): Promise<void> => {
    setBusyId(telegramId);
    setMessage(null);
    try {
      await api.adminSetUserRole(telegramId, role);
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('roleChangeFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const promote = async (): Promise<void> => {
    const telegramId = Number(promoteId.trim());
    if (!Number.isInteger(telegramId) || telegramId <= 0) {
      setMessage(t('invalidTelegramId'));
      return;
    }
    await changeRole(telegramId, 'admin');
    setPromoteId('');
  };

  return (
    <Section header={t('adminsHeader')}>
      {users.loading && <Loader />}
      {users.error && <ErrorView message={users.error} />}
      {message && <Cell style={{ color: 'var(--tgui--destructive_text_color)' }}>{message}</Cell>}
      {users.data?.map((u) => (
        <Cell
          key={u.telegramId}
          subtitle={u.username ? `@${u.username} · ${u.telegramId}` : String(u.telegramId)}
          after={
            u.role === 'admin' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge type="number" mode="primary">
                  {t('roleAdmin')}
                </Badge>
                {u.telegramId !== selfTelegramId && (
                  <Button
                    size="s"
                    mode="plain"
                    loading={busyId === u.telegramId}
                    onClick={() => void changeRole(u.telegramId, 'customer')}
                  >
                    {t('demote')}
                  </Button>
                )}
              </div>
            ) : (
              <Button
                size="s"
                mode="bezeled"
                loading={busyId === u.telegramId}
                onClick={() => void changeRole(u.telegramId, 'admin')}
              >
                {t('promote')}
              </Button>
            )
          }
        >
          {[u.firstName, u.lastName].filter(Boolean).join(' ')}
        </Cell>
      ))}

      <Input
        header={t('addAdminByIdLabel')}
        placeholder={t('telegramIdPlaceholder')}
        value={promoteId}
        onChange={(e) => setPromoteId(e.target.value.replace(/\D/g, ''))}
      />
      <div style={{ padding: 16 }}>
        <Button stretched disabled={!promoteId} onClick={() => void promote()}>
          {t('addAdmin')}
        </Button>
      </div>
    </Section>
  );
}

function BannersManager(): React.JSX.Element {
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);
  const banners = useAsync(() => api.getBanners(), [reloadKey]);
  const products = useAsync(() => api.getProducts({ limit: 100 }), []);
  const [linkProductId, setLinkProductId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const addBanner = async (file: File): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      const imageUrl = await fileToCompressedDataUrl(file, 1600, 0.75);
      await api.adminCreateBanner({
        imageUrl,
        productId: linkProductId || null,
        sortOrder: banners.data?.length ?? 0,
      });
      setLinkProductId('');
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('bannerAddFailed'));
    } finally {
      setBusy(false);
    }
  };

  const removeBanner = async (id: string): Promise<void> => {
    setBusy(true);
    try {
      await api.adminDeleteBanner(id);
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('bannerAddFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section header={t('bannersHeader')}>
      {banners.loading && <Loader />}
      {banners.error && <ErrorView message={banners.error} />}
      {message && <Cell style={{ color: 'var(--tgui--destructive_text_color)' }}>{message}</Cell>}
      {banners.data?.map((banner: Banner) => (
        <Cell
          key={banner.id}
          before={
            <img
              src={banner.imageUrl}
              alt=""
              style={{ width: 64, height: 28, objectFit: 'cover', borderRadius: 6 }}
            />
          }
          after={
            <Button
              size="s"
              mode="plain"
              loading={busy}
              onClick={() => void removeBanner(banner.id)}
            >
              {t('remove')}
            </Button>
          }
        >
          {banner.productId
            ? (products.data?.items.find((p: Product) => p.id === banner.productId)?.title ??
              t('bannerLinkedProduct'))
            : t('bannerNoLink')}
        </Cell>
      ))}

      <Input
        header={t('bannerLinkProductLabel')}
        placeholder={t('bannerLinkProductPlaceholder')}
        value={linkProductId}
        onChange={(e) => setLinkProductId(e.target.value)}
        list="banner-products"
      />
      <datalist id="banner-products">
        {products.data?.items.map((p: Product) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </datalist>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void addBanner(file);
        }}
      />
      <div style={{ padding: 16 }}>
        <Button stretched loading={busy} onClick={() => fileInputRef.current?.click()}>
          {t('addBanner')}
        </Button>
      </div>
    </Section>
  );
}

function CategoriesManager(): React.JSX.Element {
  const { t } = useLang();
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);
  const categories = useAsync(() => api.getCategories(), [reloadKey]);
  const products = useAsync(() => api.adminListProducts(), [reloadKey]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const countFor = (categoryId: string): number =>
    products.data?.filter((p: Product) => p.categoryId === categoryId).length ?? 0;

  const startEdit = (category: Category): void => {
    setEditingId(category.id);
    setEditTitle(category.title);
  };

  const saveEdit = async (category: Category): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await api.adminUpdateCategory(category.id, {
        slug: category.slug,
        title: editTitle.trim(),
        sortOrder: category.sortOrder,
      });
      setEditingId(null);
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('categorySaveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await api.adminDeleteCategory(id);
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('categoryDeleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  const create = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await api.adminCreateCategory({
        slug: newSlug.trim(),
        title: newTitle.trim(),
        sortOrder: categories.data?.length ?? 0,
      });
      setNewSlug('');
      setNewTitle('');
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('categorySaveFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section header={t('manageCategoriesHeader')}>
      {categories.loading && <Loader />}
      {categories.error && <ErrorView message={categories.error} />}
      {message && <Cell style={{ color: 'var(--tgui--destructive_text_color)' }}>{message}</Cell>}
      {categories.data?.map((category) =>
        editingId === category.id ? (
          <Cell
            key={category.id}
            after={
              <div style={{ display: 'flex', gap: 6 }}>
                <Button size="s" loading={busy} onClick={() => void saveEdit(category)}>
                  {t('saveChanges')}
                </Button>
                <Button size="s" mode="plain" onClick={() => setEditingId(null)}>
                  {t('cancel')}
                </Button>
              </div>
            }
          >
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </Cell>
        ) : (
          <Cell
            key={category.id}
            subtitle={`${countFor(category.id)} ${t('productCountLabel')}`}
            after={
              <div style={{ display: 'flex', gap: 6 }}>
                <Button size="s" mode="bezeled" onClick={() => startEdit(category)}>
                  {t('editProduct')}
                </Button>
                <Button
                  size="s"
                  mode="plain"
                  loading={busy}
                  onClick={() => void remove(category.id)}
                >
                  {t('deleteProduct')}
                </Button>
              </div>
            }
          >
            {category.title}
          </Cell>
        ),
      )}

      <Input
        header={t('titleLabel')}
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
      />
      <Input header={t('slugLabel')} value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
      <div style={{ padding: 16 }}>
        <Button
          stretched
          loading={busy}
          disabled={!newSlug || !newTitle}
          onClick={() => void create()}
        >
          {t('addCategory')}
        </Button>
      </div>
    </Section>
  );
}

function ProductsManager({ currency }: { currency: string }): React.JSX.Element {
  const { t } = useLang();
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);
  const products = useAsync(() => api.adminListProducts(), [reloadKey]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const startEdit = (product: Product): void => {
    setEditingId(product.id);
    setEditTitle(product.title);
    setEditPrice(String(product.price));
  };

  const saveEdit = async (product: Product): Promise<void> => {
    setBusy(true);
    setMessage(null);
    const input: ProductInput = {
      categoryId: product.categoryId,
      slug: product.slug,
      title: editTitle.trim(),
      description: product.description,
      price: Number(editPrice) || 0,
      currency: product.currency,
      imageUrl: product.imageUrl,
      stock: product.stock,
      isActive: product.isActive,
    };
    try {
      await api.adminUpdateProduct(product.id, input);
      setEditingId(null);
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('productUpdateFailed'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await api.adminDeleteProduct(id);
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('productDeleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section header={t('manageProductsHeader')}>
      {products.loading && <Loader />}
      {products.error && <ErrorView message={products.error} />}
      {message && <Cell style={{ color: 'var(--tgui--destructive_text_color)' }}>{message}</Cell>}
      {products.data?.map((product: Product) =>
        editingId === product.id ? (
          <Cell
            key={product.id}
            description={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <Input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="s" loading={busy} onClick={() => void saveEdit(product)}>
                    {t('saveChanges')}
                  </Button>
                  <Button size="s" mode="plain" onClick={() => setEditingId(null)}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            }
            multiline
          >
            {product.title}
          </Cell>
        ) : (
          <Cell
            key={product.id}
            before={
              product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt=""
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }}
                />
              ) : undefined
            }
            subtitle={`${formatPrice(product.price, currency)}${product.isActive ? '' : ` · ${t('inactiveLabel')}`}`}
            after={
              <div style={{ display: 'flex', gap: 6 }}>
                <Button size="s" mode="bezeled" onClick={() => startEdit(product)}>
                  {t('editProduct')}
                </Button>
                <Button
                  size="s"
                  mode="plain"
                  loading={busy}
                  onClick={() => void remove(product.id)}
                >
                  {t('deleteProduct')}
                </Button>
              </div>
            }
            multiline
          >
            {product.title}
          </Cell>
        ),
      )}
    </Section>
  );
}

function PromoCodesManager(): React.JSX.Element {
  const { t } = useLang();
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);
  const promoCodes = useAsync(() => api.adminListPromoCodes(), [reloadKey]);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const create = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await api.adminCreatePromoCode({
        code: code.trim(),
        discountPercent: Number(discountPercent) || 0,
        maxUses: maxUses.trim() ? Number(maxUses) : null,
      });
      setCode('');
      setDiscountPercent('');
      setMaxUses('');
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('promoCodeCreateFailed'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    setBusy(true);
    try {
      await api.adminDeletePromoCode(id);
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('promoCodeCreateFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section header={t('promoCodesHeader')}>
      {promoCodes.loading && <Loader />}
      {promoCodes.error && <ErrorView message={promoCodes.error} />}
      {message && <Cell style={{ color: 'var(--tgui--destructive_text_color)' }}>{message}</Cell>}
      {promoCodes.data?.map((promo: PromoCode) => (
        <Cell
          key={promo.id}
          subtitle={`${promo.discountPercent}% · ${t('usedLabel')}: ${promo.usedCount}/${promo.maxUses ?? t('unlimitedLabel')}`}
          after={
            <Button size="s" mode="plain" loading={busy} onClick={() => void remove(promo.id)}>
              {t('remove')}
            </Button>
          }
        >
          {promo.code}
        </Cell>
      ))}

      <Input
        header={t('promoCodeValueLabel')}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <Input
        header={t('discountPercentLabel')}
        type="number"
        value={discountPercent}
        onChange={(e) => setDiscountPercent(e.target.value)}
      />
      <Input
        header={t('maxUsesLabel')}
        placeholder={t('maxUsesPlaceholder')}
        type="number"
        value={maxUses}
        onChange={(e) => setMaxUses(e.target.value)}
      />
      <div style={{ padding: 16 }}>
        <Button
          stretched
          loading={busy}
          disabled={!code.trim() || !discountPercent}
          onClick={() => void create()}
        >
          {t('addPromoCode')}
        </Button>
      </div>
    </Section>
  );
}

function ShopSettingsForm({
  shop,
  onSaved,
}: {
  shop: ShopConfig | null;
  onSaved: () => void;
}): React.JSX.Element {
  const { t } = useLang();
  const [cardNumber, setCardNumber] = useState(shop?.cardNumber ?? '');
  const [cardHolder, setCardHolder] = useState(shop?.cardHolder ?? '');
  const [paymentInstructions, setPaymentInstructions] = useState(shop?.paymentInstructions ?? '');
  const [initialized, setInitialized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (shop && !initialized) {
    setCardNumber(shop.cardNumber ?? '');
    setCardHolder(shop.cardHolder ?? '');
    setPaymentInstructions(shop.paymentInstructions ?? '');
    setInitialized(true);
  }

  const submit = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await api.adminUpdateShop({
        cardNumber: cardNumber.trim() || null,
        cardHolder: cardHolder.trim() || null,
        paymentInstructions: paymentInstructions.trim() || null,
      });
      setMessage(t('settingsSaved'));
      onSaved();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('saveSettingsFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section header={t('shopSettingsHeader')}>
      <Input
        header={t('cardNumberLabel')}
        placeholder={t('cardNumberPlaceholder')}
        value={cardNumber}
        onChange={(e) => setCardNumber(e.target.value)}
      />
      <Input
        header={t('cardHolderLabel')}
        placeholder={t('cardHolderPlaceholder')}
        value={cardHolder}
        onChange={(e) => setCardHolder(e.target.value)}
      />
      <Textarea
        header={t('paymentInstructionsLabel')}
        placeholder={t('paymentInstructionsPlaceholder')}
        value={paymentInstructions}
        onChange={(e) => setPaymentInstructions(e.target.value)}
      />
      <div style={{ padding: 16 }}>
        <Button stretched loading={busy} onClick={() => void submit()}>
          {t('saveSettings')}
        </Button>
        {message && <Cell>{message}</Cell>}
      </div>
    </Section>
  );
}

function NewProductForm({
  currency,
  onCreated,
}: {
  currency: string;
  onCreated: () => void;
}): React.JSX.Element {
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onPickImage = async (file: File): Promise<void> => {
    setImageUrl(await fileToCompressedDataUrl(file, 1200, 0.75));
  };

  const submit = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    const input: ProductInput = {
      categoryId: null,
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      currency,
      imageUrl,
      stock: null,
      isActive: true,
    };
    try {
      const created = await api.adminCreateProduct(input);
      setMessage(t('createdProduct', { title: created.title }));
      setTitle('');
      setSlug('');
      setPrice('');
      setDescription('');
      setImageUrl(null);
      onCreated();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('failedToCreateProduct'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section header={t('addProduct')}>
      <Input header={t('titleLabel')} value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input header={t('slugLabel')} value={slug} onChange={(e) => setSlug(e.target.value)} />
      <Input
        header={t('priceLabel', { currency })}
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Textarea
        header={t('descriptionLabel')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onPickImage(file);
        }}
      />
      <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
          />
        )}
        <Button size="s" mode="bezeled" onClick={() => fileInputRef.current?.click()}>
          {t('chooseFile')}
        </Button>
      </div>
      <div style={{ padding: 16 }}>
        <Button stretched loading={busy} disabled={!title || !slug} onClick={() => void submit()}>
          {t('createProduct')}
        </Button>
        {message && <Cell>{message}</Cell>}
      </div>
    </Section>
  );
}
