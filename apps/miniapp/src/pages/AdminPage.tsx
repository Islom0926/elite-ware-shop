import { useState } from 'react';
import { Button, Cell, Input, List, Section, Textarea } from '@telegram-apps/telegram-ui';
import type { OrderStatus, ProductInput, ShopConfig } from '@tma-shop/shared';
import { api, ApiClientError } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSession } from '../providers/SessionProvider.js';
import { formatPrice } from '../lib/format.js';
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
  const { isAdmin } = useSession();
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
                  <Button
                    size="s"
                    mode="filled"
                    onClick={() => void setStatus(order.id, 'paid')}
                  >
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
    </List>
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
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      imageUrl: null,
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
      <div style={{ padding: 16 }}>
        <Button stretched loading={busy} disabled={!title || !slug} onClick={() => void submit()}>
          {t('createProduct')}
        </Button>
        {message && <Cell>{message}</Cell>}
      </div>
    </Section>
  );
}
