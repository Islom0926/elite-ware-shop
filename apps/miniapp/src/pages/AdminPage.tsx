import { useRef, useState } from 'react';
import { Badge, Button, Cell, Input, List, Section, Textarea } from '@telegram-apps/telegram-ui';
import type { Banner, OrderStatus, Product, ProductInput, ShopConfig } from '@tma-shop/shared';
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
      <NewProductForm currency={shop.data?.currency ?? 'UZS'} onCreated={reload} />

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
