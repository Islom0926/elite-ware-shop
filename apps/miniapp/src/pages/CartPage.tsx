import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Cell, Input, List, Placeholder, Section } from '@telegram-apps/telegram-ui';
import type { PromoPreview } from '@tma-shop/shared';
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
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const applyPromo = useCallback(async () => {
    if (!promoInput.trim()) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      setPromo(await api.previewPromoCode(promoInput.trim()));
    } catch (err) {
      setPromo(null);
      setPromoError(err instanceof ApiClientError ? err.message : t('promoInvalid'));
    } finally {
      setPromoBusy(false);
    }
  }, [promoInput, t]);

  const checkout = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { orderId } = await api.createOrder(promo?.code);
      navigate(`/pay/${orderId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('orderCreateFailed'));
    } finally {
      setBusy(false);
    }
  }, [navigate, t, promo]);

  const hasItems = (cart?.lines.length ?? 0) > 0;
  const finalTotal = promo ? promo.total : (cart?.total ?? 0);

  useMainButton({
    text: cart
      ? t('checkoutWithPrice', { price: formatPrice(finalTotal, cart.currency) })
      : t('checkout'),
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

      <Section header={t('promoCodeLabel')}>
        {promoError && (
          <Cell style={{ color: 'var(--tgui--destructive_text_color)' }}>{promoError}</Cell>
        )}
        {promo ? (
          <Cell after={`-${formatPrice(promo.discountAmount, cart?.currency ?? '')}`}>
            {promo.code} · {t('promoApplied')}
          </Cell>
        ) : (
          <>
            <Input
              placeholder={t('promoCodePlaceholder')}
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
            />
            <div style={{ padding: 16 }}>
              <Button
                stretched
                mode="bezeled"
                loading={promoBusy}
                disabled={!promoInput.trim()}
                onClick={() => void applyPromo()}
              >
                {t('applyPromo')}
              </Button>
            </div>
          </>
        )}
      </Section>

      <Section>
        {promo && (
          <Cell after={cart ? formatPrice(cart.total, cart.currency) : ''}>
            {t('cart')} · {t('total')}
          </Cell>
        )}
        {promo && (
          <Cell after={`-${formatPrice(promo.discountAmount, cart?.currency ?? '')}`}>
            {t('discountLabel')}
          </Cell>
        )}
        <Cell after={cart ? formatPrice(finalTotal, cart.currency) : ''}>{t('total')}</Cell>
      </Section>
    </List>
  );
}
