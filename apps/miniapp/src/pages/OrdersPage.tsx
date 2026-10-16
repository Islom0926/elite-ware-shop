import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Placeholder } from '@telegram-apps/telegram-ui';
import type { Order, OrderStatus } from '@tma-shop/shared';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatPrice, pluralize } from '../lib/format.js';
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

type Tab = 'active' | 'completed' | 'cancelled';

const TAB_STATUSES: Record<Tab, OrderStatus[]> = {
  active: [
    'pending',
    'awaiting_payment',
    'paid',
    'accepted',
    'in_china',
    'at_china_border',
    'at_warehouse',
    'shipped',
  ],
  completed: ['delivered', 'fulfilled'],
  cancelled: ['cancelled'],
};

export function OrdersPage(): React.JSX.Element {
  const { data: orders, loading, error } = useAsync(() => api.getOrders(), []);
  const { t } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('active');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} />;
  if (!orders || orders.length === 0) {
    return (
      <Placeholder header={t('noOrdersYetHeader')} description={t('noOrdersYetDesc')}>
        <span style={{ fontSize: 48 }}>📦</span>
      </Placeholder>
    );
  }

  const filtered = orders.filter((o) => TAB_STATUSES[tab].includes(o.status));

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{t('myOrdersHeader')}</div>

      <div
        style={{
          display: 'flex',
          gap: 20,
          borderBottom: '1px solid var(--tgui--secondary_bg_color)',
          marginBottom: 16,
        }}
      >
        {(['active', 'completed', 'cancelled'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '0 0 10px',
              fontSize: 14,
              fontWeight: 700,
              color: tab === key ? 'var(--tgui--text_color)' : 'var(--tgui--hint_color)',
              borderBottom: tab === key ? '2px solid var(--brand)' : '2px solid transparent',
            }}
          >
            {t(
              key === 'active'
                ? 'ordersTabActive'
                : key === 'completed'
                  ? 'ordersTabCompleted'
                  : 'ordersTabCancelled',
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Placeholder description={t('noOrders')}>
          <span style={{ fontSize: 40 }}>📦</span>
        </Placeholder>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((order: Order) => (
            <div
              key={order.id}
              className="card-surface"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--chip-bg)',
                }}
              >
                {order.items[0]?.imageUrl && (
                  <img
                    src={order.items[0].imageUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  {t('orderNumber', { id: order.id.slice(0, 8) })}
                </span>
                <span style={{ fontSize: 12, color: 'var(--tgui--hint_color)' }}>
                  {pluralize(order.items.length, t('item'), t('items'))}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
                  {formatPrice(order.total, order.currency)}
                </span>
                {order.receiptImage && (
                  <button
                    type="button"
                    onClick={() => setLightboxImage(order.receiptImage)}
                    style={{
                      alignSelf: 'flex-start',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      marginTop: 2,
                      cursor: 'pointer',
                      color: 'var(--brand)',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    🧾 {t('viewReceiptLabel')}
                  </button>
                )}
              </div>
              <button
                type="button"
                className="press-anim"
                onClick={() => order.status === 'pending' && navigate(`/pay/${order.id}`)}
                style={{
                  border: 'none',
                  borderRadius: 'var(--pill-radius)',
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: order.status === 'pending' ? 'pointer' : 'default',
                  background: order.status === 'pending' ? 'var(--brand)' : 'var(--chip-bg)',
                  color: order.status === 'pending' ? '#fff' : 'var(--tgui--hint_color)',
                }}
              >
                {t(STATUS_LABEL_KEY[order.status])}
              </button>
            </div>
          ))}
        </div>
      )}
      {lightboxImage && (
        <ImageLightbox
          images={[lightboxImage]}
          index={0}
          onIndexChange={() => undefined}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
