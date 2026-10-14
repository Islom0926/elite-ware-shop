import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Cell, List, Placeholder, Section } from '@telegram-apps/telegram-ui';
import { api, ApiClientError } from '../api/client.js';
import { useCart } from '../providers/CartProvider.js';
import { useMainButton } from '../hooks/useMainButton.js';
import { formatPrice } from '../lib/format.js';
import { Loader } from '../components/Loader.js';
import { useLang } from '../i18n/LanguageProvider.js';

export function CartPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { cart, loading, setQuantity, remove } = useCart();
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { orderId } = await api.createOrder();
      navigate(`/pay/${orderId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('orderCreateFailed'));
    } finally {
      setBusy(false);
    }
  }, [navigate, t]);

  const hasItems = (cart?.lines.length ?? 0) > 0;

  useMainButton({
    text: cart ? t('checkoutWithPrice', { price: formatPrice(cart.total, cart.currency) }) : t('checkout'),
    visible: hasItems,
    loading: busy,
    onClick: checkout,
  });

  if (loading && !cart) return <Loader />;

  if (!hasItems) {
    return (
      <Placeholder header={t('cartEmptyHeader')} description={t('cartEmptyDesc')}>
        <span style={{ fontSize: 48 }}>🛒</span>
      </Placeholder>
    );
  }

  return (
    <List>
      {error && (
        <Section>
          <Cell style={{ color: 'var(--tgui--destructive_text_color)' }}>{error}</Cell>
        </Section>
      )}
      <Section header={t('cart')}>
        {cart?.lines.map((line) => (
          <Cell
            key={line.product.id}
            subtitle={formatPrice(line.product.price, line.product.currency)}
            after={formatPrice(line.subtotal, cart.currency)}
            description={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <Button
                  size="s"
                  mode="bezeled"
                  onClick={() => void setQuantity(line.product.id, line.quantity - 1)}
                >
                  −
                </Button>
                <span>{line.quantity}</span>
                <Button
                  size="s"
                  mode="bezeled"
                  onClick={() => void setQuantity(line.product.id, line.quantity + 1)}
                >
                  +
                </Button>
                <Button size="s" mode="plain" onClick={() => void remove(line.product.id)}>
                  {t('remove')}
                </Button>
              </div>
            }
            multiline
          >
            {line.product.title}
          </Cell>
        ))}
      </Section>
      <Section>
        <Cell after={cart ? formatPrice(cart.total, cart.currency) : ''}>{t('total')}</Cell>
      </Section>
    </List>
  );
}
