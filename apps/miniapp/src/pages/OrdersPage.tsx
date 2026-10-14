import { Badge, Cell, List, Placeholder, Section } from '@telegram-apps/telegram-ui';
import type { OrderStatus } from '@tma-shop/shared';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatPrice, pluralize } from '../lib/format.js';
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

export function OrdersPage(): React.JSX.Element {
  const { data: orders, loading, error } = useAsync(() => api.getOrders(), []);
  const { t } = useLang();

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} />;
  if (!orders || orders.length === 0) {
    return (
      <Placeholder header={t('noOrdersYetHeader')} description={t('noOrdersYetDesc')}>
        <span style={{ fontSize: 48 }}>📦</span>
      </Placeholder>
    );
  }

  return (
    <List>
      <Section header={t('myOrdersHeader')}>
        {orders.map((order) => (
          <Cell
            key={order.id}
            subtitle={pluralize(order.items.length, t('item'), t('items'))}
            after={formatPrice(order.total, order.currency)}
            description={<Badge type="dot" />}
            hint={t(STATUS_LABEL_KEY[order.status])}
            multiline
          >
            {t('orderNumber', { id: order.id.slice(0, 8) })}
          </Cell>
        ))}
      </Section>
    </List>
  );
}
