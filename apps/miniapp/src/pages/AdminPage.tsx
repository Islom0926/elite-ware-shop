import { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Cell,
  Input,
  List,
  Section,
  Select,
  Textarea,
} from '@telegram-apps/telegram-ui';
import type {
  Banner,
  Category,
  OrderStatus,
  Product,
  ProductColor,
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
import { ImageLightbox } from '../components/ImageLightbox.js';
import { useLang } from '../i18n/LanguageProvider.js';
import type { Dictionary } from '../i18n/translations.js';

const STATUS_LABEL_KEY: Record<OrderStatus, keyof Dictionary> = {
  pending: 'statusPending',
  awaiting_payment: 'statusAwaitingPayment',
  paid: 'statusPaid',
  cancelled: 'statusCancelled',
  fulfilled: 'statusFulfilled',
  in_delivery: 'statusInDelivery',
  accepted: 'statusAccepted',
  in_china: 'statusInChina',
  at_china_border: 'statusAtChinaBorder',
  at_warehouse: 'statusAtWarehouse',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
};

/**
 * The post-payment fulfillment pipeline, in order:
 * accepted -> in_china -> at_china_border -> at_warehouse -> shipped -> delivered
 */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'accepted',
  accepted: 'in_china',
  in_china: 'at_china_border',
  at_china_border: 'at_warehouse',
  at_warehouse: 'shipped',
  shipped: 'delivered',
};
const NEXT_STATUS_LABEL_KEY: Partial<Record<OrderStatus, keyof Dictionary>> = {
  paid: 'acceptOrder',
  accepted: 'markInChina',
  in_china: 'markAtChinaBorder',
  at_china_border: 'markAtWarehouse',
  at_warehouse: 'markShipped',
  shipped: 'markDelivered',
};

const CANCELLABLE_STATUSES: OrderStatus[] = [
  'pending',
  'awaiting_payment',
  'paid',
  'accepted',
  'in_china',
  'at_china_border',
  'at_warehouse',
];

type AdminTab = 'products' | 'payments' | 'orders' | 'stats';

const ADMIN_TABS: { key: AdminTab; icon: string; labelKey: keyof Dictionary }[] = [
  { key: 'products', icon: '🏷️', labelKey: 'adminTabProducts' },
  { key: 'payments', icon: '💳', labelKey: 'adminTabPayments' },
  { key: 'orders', icon: '📦', labelKey: 'adminTabOrders' },
  { key: 'stats', icon: '📊', labelKey: 'adminTabStats' },
];

export function AdminPage(): React.JSX.Element {
  const { isAdmin, user } = useSession();
  const { t } = useLang();
  const [tab, setTab] = useState<AdminTab>('products');
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);

  const shop = useAsync(() => api.getShop(), [reloadKey]);

  if (!isAdmin) return <ErrorView message={t('adminsOnly')} />;

  return (
    <div style={{ paddingBottom: 90 }}>
      {tab === 'products' && (
        <List>
          <CategoriesManager />
          <NewProductForm currency={shop.data?.currency ?? 'UZS'} onCreated={reload} />
          <ProductsManager currency={shop.data?.currency ?? 'UZS'} />
          <BannersManager />
        </List>
      )}
      {tab === 'payments' && (
        <List>
          <ReceiptsReview currency={shop.data?.currency ?? 'UZS'} />
          <ShopSettingsForm shop={shop.data} onSaved={reload} />
        </List>
      )}
      {tab === 'orders' && (
        <List>
          <OrdersManager currency={shop.data?.currency ?? 'UZS'} />
        </List>
      )}
      {tab === 'stats' && (
        <List>
          <StatsOverview />
          <RequiredChannelsManager />
          <AdminsManager selfTelegramId={user?.telegramId ?? null} />
          <PromoCodesManager />
        </List>
      )}

      <nav
        className="card-surface"
        style={{
          position: 'fixed',
          left: 16,
          right: 16,
          bottom: 'calc(84px + env(safe-area-inset-bottom))',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '10px 8px',
          zIndex: 50,
          borderRadius: 24,
        }}
      >
        {ADMIN_TABS.map(({ key, icon, labelKey }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              className="press-anim"
              onClick={() => setTab(key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                border: 'none',
                background: 'none',
                padding: '4px 10px',
                cursor: 'pointer',
                color: active ? 'var(--brand)' : 'var(--tgui--hint_color)',
              }}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{t(labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function ReceiptsReview({ currency }: { currency: string }): React.JSX.Element {
  const { t } = useLang();
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);
  const orders = useAsync(() => api.adminGetOrders(), [reloadKey]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = orders.data?.filter((o) => o.status === 'awaiting_payment') ?? [];

  const decide = async (id: string, status: 'paid' | 'cancelled'): Promise<void> => {
    setBusyId(id);
    try {
      await api.adminSetOrderStatus(id, status);
      reload();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Section header={t('receiptsReviewHeader')}>
      {orders.loading && <Loader />}
      {orders.error && <ErrorView message={orders.error} />}
      {pending.length === 0 && <Cell>{t('noPendingReceipts')}</Cell>}
      {pending.map((order) => (
        <Cell
          key={order.id}
          subtitle={formatPrice(order.total, order.currency || currency)}
          description={
            order.receiptImage ? (
              <button
                type="button"
                onClick={() => setLightboxImage(order.receiptImage)}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
              >
                <img
                  src={order.receiptImage}
                  alt={t('receiptLabel')}
                  style={{ maxWidth: 140, borderRadius: 8, display: 'block', marginTop: 6 }}
                />
              </button>
            ) : undefined
          }
          after={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Button
                size="s"
                mode="filled"
                loading={busyId === order.id}
                onClick={() => void decide(order.id, 'paid')}
              >
                {t('confirmPayment')}
              </Button>
              <Button
                size="s"
                mode="plain"
                loading={busyId === order.id}
                onClick={() => void decide(order.id, 'cancelled')}
              >
                {t('rejectReceipt')}
              </Button>
            </div>
          }
          multiline
        >
          {t('orderNumber', { id: order.id.slice(0, 8) })}
        </Cell>
      ))}
      {lightboxImage && (
        <ImageLightbox
          images={[lightboxImage]}
          index={0}
          onIndexChange={() => undefined}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </Section>
  );
}

const ADMIN_ORDER_COMPLETED_STATUSES: OrderStatus[] = [
  'shipped',
  'delivered',
  'fulfilled',
  'cancelled',
];

function OrdersManager({ currency }: { currency: string }): React.JSX.Element {
  const { t } = useLang();
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);
  const orders = useAsync(() => api.adminGetOrders(), [reloadKey]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const setStatus = async (id: string, status: OrderStatus): Promise<void> => {
    setBusyId(id);
    try {
      await api.adminSetOrderStatus(id, status);
      reload();
    } finally {
      setBusyId(null);
    }
  };

  const filtered = orders.data?.filter((order) =>
    tab === 'completed'
      ? ADMIN_ORDER_COMPLETED_STATUSES.includes(order.status)
      : !ADMIN_ORDER_COMPLETED_STATUSES.includes(order.status),
  );

  return (
    <Section header={t('allOrders')}>
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        {(['active', 'completed'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className="press-anim"
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 'var(--pill-radius)',
              padding: '8px 0',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: tab === key ? 'var(--brand)' : 'var(--chip-bg)',
              color: tab === key ? '#fff' : 'var(--tgui--hint_color)',
            }}
          >
            {t(key === 'active' ? 'ordersTabActive' : 'ordersTabCompleted')}
          </button>
        ))}
      </div>
      {orders.loading && <Loader />}
      {orders.error && <ErrorView message={orders.error} />}
      {filtered?.length === 0 && <Cell>{t('noOrders')}</Cell>}
      {filtered?.map((order) => (
        <Cell
          key={order.id}
          before={
            order.items[0]?.imageUrl ? (
              <img
                src={order.items[0].imageUrl}
                alt=""
                style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }}
              />
            ) : undefined
          }
          subtitle={`${t(STATUS_LABEL_KEY[order.status])} · ${formatPrice(order.total, order.currency || currency)}`}
          description={
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--tgui--hint_color)' }}>
              {order.items
                .map((item) =>
                  [item.title, item.selectedColor, item.selectedSize].filter(Boolean).join(' · '),
                )
                .join('; ')}
              {order.deliveryAddress && (
                <div style={{ marginTop: 2 }}>📍 {order.deliveryAddress}</div>
              )}
              {order.receiptImage && (
                <button
                  type="button"
                  onClick={() => setLightboxImage(order.receiptImage)}
                  style={{
                    marginTop: 6,
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--brand)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  🧾 {t('viewReceiptLabel')}
                </button>
              )}
            </div>
          }
          after={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {order.status === 'awaiting_payment' && (
                <Button
                  size="s"
                  mode="filled"
                  loading={busyId === order.id}
                  onClick={() => void setStatus(order.id, 'paid')}
                >
                  {t('confirmPayment')}
                </Button>
              )}
              {NEXT_STATUS[order.status] && (
                <Button
                  size="s"
                  mode="bezeled"
                  loading={busyId === order.id}
                  onClick={() => void setStatus(order.id, NEXT_STATUS[order.status] as OrderStatus)}
                >
                  {t(NEXT_STATUS_LABEL_KEY[order.status] as keyof Dictionary)}
                </Button>
              )}
              {CANCELLABLE_STATUSES.includes(order.status) && (
                <Button
                  size="s"
                  mode="plain"
                  loading={busyId === order.id}
                  onClick={() => void setStatus(order.id, 'cancelled')}
                >
                  {t('cancel')}
                </Button>
              )}
            </div>
          }
          multiline
        >
          {t('orderNumber', { id: order.id.slice(0, 8) })}
        </Cell>
      ))}
      {lightboxImage && (
        <ImageLightbox
          images={[lightboxImage]}
          index={0}
          onIndexChange={() => undefined}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </Section>
  );
}

function StatsOverview(): React.JSX.Element {
  const { t } = useLang();
  const stats = useAsync(() => api.adminGetStats(), []);

  if (stats.loading) return <Loader />;
  if (stats.error) return <ErrorView message={stats.error} />;
  if (!stats.data) return <></>;

  return (
    <Section header={t('statsHeader')}>
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px' }}>
        <div
          className="card-surface"
          style={{ flex: 1, padding: '14px 12px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)' }}>
            {formatPrice(stats.data.totalRevenue, stats.data.currency)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)', marginTop: 2 }}>
            {t('totalRevenueLabel')}
          </div>
        </div>
        <div
          className="card-surface"
          style={{ flex: 1, padding: '14px 12px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.data.userCount}</div>
          <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)', marginTop: 2 }}>
            {t('userCountLabel')}
          </div>
        </div>
        <div
          className="card-surface"
          style={{ flex: 1, padding: '14px 12px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.data.orderCount}</div>
          <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)', marginTop: 2 }}>
            {t('orderCountLabel')}
          </div>
        </div>
      </div>
    </Section>
  );
}

function RequiredChannelsManager(): React.JSX.Element {
  const { t } = useLang();
  const [reloadKey, setReloadKey] = useState(0);
  const reload = (): void => setReloadKey((k) => k + 1);
  const channels = useAsync(() => api.adminListChannels(), [reloadKey]);
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const create = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await api.adminCreateChannel({ username: username.trim(), title: title.trim() });
      setUsername('');
      setTitle('');
      reload();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('channelSaveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    setBusy(true);
    try {
      await api.adminDeleteChannel(id);
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section header={t('requiredChannelsHeader')}>
      {channels.loading && <Loader />}
      {channels.error && <ErrorView message={channels.error} />}
      {message && <Cell style={{ color: 'var(--tgui--destructive_text_color)' }}>{message}</Cell>}
      {channels.data?.length === 0 && <Cell>{t('noRequiredChannels')}</Cell>}
      {channels.data?.map((ch) => (
        <Cell
          key={ch.id}
          subtitle={`@${ch.username}`}
          after={
            <Button size="s" mode="plain" loading={busy} onClick={() => void remove(ch.id)}>
              {t('remove')}
            </Button>
          }
        >
          {ch.title}
        </Cell>
      ))}
      <Input
        header={t('channelTitleLabel')}
        placeholder={t('channelTitlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        header={t('channelUsernameLabel')}
        placeholder={t('channelUsernamePlaceholder')}
        value={username}
        onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
      />
      <div style={{ padding: 16 }}>
        <Button
          stretched
          loading={busy}
          disabled={!username.trim() || !title.trim()}
          onClick={() => void create()}
        >
          {t('addChannel')}
        </Button>
      </div>
    </Section>
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
  const categories = useAsync(() => api.getCategories(), []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editColors, setEditColors] = useState<ProductColor[]>([]);
  const [editSizes, setEditSizes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const startEdit = (product: Product): void => {
    setEditingId(product.id);
    setEditTitle(product.title);
    setEditPrice(String(product.price));
    setEditCategoryId(product.categoryId ?? '');
    setEditImages(product.images);
    setEditColors(product.colors);
    setEditSizes(product.sizes);
  };

  const saveEdit = async (product: Product): Promise<void> => {
    setBusy(true);
    setMessage(null);
    const input: ProductInput = {
      categoryId: editCategoryId || null,
      slug: product.slug,
      title: editTitle.trim(),
      description: product.description,
      price: Number(editPrice) || 0,
      currency: product.currency,
      imageUrl: product.imageUrl,
      images: editImages,
      colors: editColors,
      sizes: editSizes,
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
          <div
            key={product.id}
            style={{ paddingBottom: 12, borderBottom: '1px solid var(--chip-bg)' }}
          >
            <Cell
              description={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                  <Select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                  >
                    <option value="">{t('noCategoryLabel')}</option>
                    {categories.data?.map((category: Category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </Select>
                </div>
              }
              multiline
            >
              {product.title}
            </Cell>
            <VariantFields
              images={editImages}
              setImages={setEditImages}
              colors={editColors}
              setColors={setEditColors}
              sizes={editSizes}
              setSizes={setEditSizes}
            />
            <div style={{ display: 'flex', gap: 6, padding: '0 16px' }}>
              <Button size="s" loading={busy} onClick={() => void saveEdit(product)}>
                {t('saveChanges')}
              </Button>
              <Button size="s" mode="plain" onClick={() => setEditingId(null)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
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

/** Shared gallery/colors/sizes editor, used by both the create and edit product forms. */
function VariantFields({
  images,
  setImages,
  colors,
  setColors,
  sizes,
  setSizes,
}: {
  images: string[];
  setImages: (images: string[]) => void;
  colors: ProductColor[];
  setColors: (colors: ProductColor[]) => void;
  sizes: string[];
  setSizes: (sizes: string[]) => void;
}): React.JSX.Element {
  const { t } = useLang();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [colorEditIndex, setColorEditIndex] = useState<number | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newSize, setNewSize] = useState('');

  const onPickGalleryImages = async (files: FileList): Promise<void> => {
    const compressed = await Promise.all(
      Array.from(files).map((file) => fileToCompressedDataUrl(file, 1200, 0.75)),
    );
    setImages([...images, ...compressed]);
  };

  const onPickColorImage = async (file: File): Promise<void> => {
    if (colorEditIndex === null) return;
    const dataUrl = await fileToCompressedDataUrl(file, 800, 0.75);
    setColors(colors.map((c, i) => (i === colorEditIndex ? { ...c, imageUrl: dataUrl } : c)));
    setColorEditIndex(null);
  };

  const addColor = (): void => {
    const name = newColorName.trim();
    if (!name || colors.some((c) => c.name === name)) return;
    setColors([...colors, { name, imageUrl: null }]);
    setNewColorName('');
  };

  const addSize = (): void => {
    const size = newSize.trim();
    if (!size || sizes.includes(size)) return;
    setSizes([...sizes, size]);
    setNewSize('');
  };

  return (
    <>
      <div style={{ padding: '0 16px 4px', fontSize: 13, fontWeight: 700, opacity: 0.7 }}>
        {t('productImagesLabel')}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px 12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {images.map((img, i) => (
          <div key={img.slice(0, 32) + i} style={{ position: 'relative' }}>
            <img
              src={img}
              alt=""
              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
            />
            <button
              type="button"
              onClick={() => setImages(images.filter((_, idx) => idx !== i))}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: 'none',
                background: '#ff5a6a',
                color: '#fff',
                fontSize: 11,
                lineHeight: '18px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.length) void onPickGalleryImages(e.target.files);
            e.target.value = '';
          }}
        />
        <Button size="s" mode="bezeled" onClick={() => galleryInputRef.current?.click()}>
          {t('addImage')}
        </Button>
      </div>

      <div style={{ padding: '0 16px 4px', fontSize: 13, fontWeight: 700, opacity: 0.7 }}>
        {t('colorsLabel')}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px 12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {colors.map((c, i) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => {
                setColorEditIndex(i);
                colorInputRef.current?.click();
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                overflow: 'hidden',
                border: 'none',
                background: 'var(--chip-bg)',
                cursor: 'pointer',
                fontSize: 10,
              }}
              title={c.name}
            >
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                c.name.slice(0, 3)
              )}
            </button>
            <span style={{ fontSize: 12 }}>{c.name}</span>
            <button
              type="button"
              onClick={() => setColors(colors.filter((_, idx) => idx !== i))}
              style={{ border: 'none', background: 'none', color: '#ff5a6a', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <input
        ref={colorInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onPickColorImage(file);
          e.target.value = '';
        }}
      />
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
        <Input
          placeholder={t('colorNamePlaceholder')}
          value={newColorName}
          onChange={(e) => setNewColorName(e.target.value)}
        />
        <Button size="s" disabled={!newColorName.trim()} onClick={addColor}>
          {t('addColor')}
        </Button>
      </div>

      <div style={{ padding: '0 16px 4px', fontSize: 13, fontWeight: 700, opacity: 0.7 }}>
        {t('sizesLabel')}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', flexWrap: 'wrap' }}>
        {sizes.map((size) => (
          <span
            key={size}
            className="surface-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              fontSize: 12,
            }}
          >
            {size}
            <button
              type="button"
              onClick={() => setSizes(sizes.filter((s) => s !== size))}
              style={{ border: 'none', background: 'none', color: '#ff5a6a', cursor: 'pointer' }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
        <Input
          placeholder={t('sizePlaceholder')}
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
        />
        <Button size="s" disabled={!newSize.trim()} onClick={addSize}>
          {t('addSize')}
        </Button>
      </div>
    </>
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
  const categories = useAsync(() => api.getCategories(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onPickImage = async (file: File): Promise<void> => {
    setImageUrl(await fileToCompressedDataUrl(file, 1200, 0.75));
  };

  const submit = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    const input: ProductInput = {
      categoryId: categoryId || null,
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      currency,
      imageUrl,
      images,
      colors,
      sizes,
      stock: null,
      isActive: true,
    };
    try {
      const created = await api.adminCreateProduct(input);
      setMessage(t('createdProduct', { title: created.title }));
      setTitle('');
      setSlug('');
      setCategoryId('');
      setPrice('');
      setDescription('');
      setImageUrl(null);
      setImages([]);
      setColors([]);
      setSizes([]);
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
      <Select
        header={t('categoryLabel')}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        <option value="">{t('noCategoryLabel')}</option>
        {categories.data?.map((category: Category) => (
          <option key={category.id} value={category.id}>
            {category.title}
          </option>
        ))}
      </Select>
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

      <VariantFields
        images={images}
        setImages={setImages}
        colors={colors}
        setColors={setColors}
        sizes={sizes}
        setSizes={setSizes}
      />

      <div style={{ padding: 16 }}>
        <Button stretched loading={busy} disabled={!title || !slug} onClick={() => void submit()}>
          {t('createProduct')}
        </Button>
        {message && <Cell>{message}</Cell>}
      </div>
    </Section>
  );
}
