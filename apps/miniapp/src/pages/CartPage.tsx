import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Placeholder } from '@telegram-apps/telegram-ui';
import type { PromoPreview } from '@tma-shop/shared';
import { api, ApiClientError } from '../api/client.js';
import { useCart } from '../providers/CartProvider.js';
import { useMainButton } from '../hooks/useMainButton.js';
import { formatPrice } from '../lib/format.js';
import { Loader } from '../components/Loader.js';
import { useLang } from '../i18n/LanguageProvider.js';

function TrashIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7"
        stroke="#ff5a6a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CartPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { cart, loading, setQuantity, remove, refresh } = useCart();
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
      await refresh();
      navigate(`/pay/${orderId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('orderCreateFailed'));
    } finally {
      setBusy(false);
    }
  }, [navigate, t, promo, refresh]);

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
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{t('cart')}</div>

      {error && (
        <div style={{ color: 'var(--tgui--destructive_text_color)', marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cart?.lines.map((line) => (
          <div
            key={`${line.product.id}:${line.selectedColor ?? ''}:${line.selectedSize ?? ''}`}
            className="card-surface"
            style={{ display: 'flex', gap: 12, padding: 12, position: 'relative' }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--chip-bg)',
              }}
            >
              {line.product.imageUrl && (
                <img
                  src={line.product.imageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{line.product.title}</span>
                <button
                  type="button"
                  onClick={() =>
                    void remove(line.product.id, line.selectedColor, line.selectedSize)
                  }
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}
                  aria-label={t('remove')}
                >
                  <TrashIcon />
                </button>
              </div>
              {(line.selectedColor || line.selectedSize) && (
                <span style={{ fontSize: 12, color: 'var(--tgui--hint_color)' }}>
                  {[
                    line.selectedColor && `${t('colorLabel')}: ${line.selectedColor}`,
                    line.selectedSize && `${t('sizeLabel')}: ${line.selectedSize}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
                {formatPrice(line.product.price, line.product.currency)}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <button
                  type="button"
                  className="chip-btn brand press-anim"
                  style={{ width: 26, height: 26, fontSize: 15 }}
                  onClick={() =>
                    void setQuantity(
                      line.product.id,
                      line.quantity - 1,
                      line.selectedColor,
                      line.selectedSize,
                    )
                  }
                >
                  −
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                  {line.quantity}
                </span>
                <button
                  type="button"
                  className="chip-btn brand press-anim"
                  style={{ width: 26, height: 26, fontSize: 15 }}
                  onClick={() =>
                    void setQuantity(
                      line.product.id,
                      line.quantity + 1,
                      line.selectedColor,
                      line.selectedSize,
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {promoError && (
          <div
            style={{ color: 'var(--tgui--destructive_text_color)', fontSize: 13, marginBottom: 8 }}
          >
            {promoError}
          </div>
        )}
        {promo ? (
          <div
            className="surface-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {promo.code} · {t('promoApplied')}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--brand)' }}>
              -{formatPrice(promo.discountAmount, cart?.currency ?? '')}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="surface-row"
              placeholder={t('promoCodePlaceholder')}
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '14px 16px',
                fontSize: 14,
                color: 'var(--tgui--text_color)',
                background: 'var(--chip-bg)',
              }}
            />
            <button
              type="button"
              className="press-anim"
              disabled={!promoInput.trim() || promoBusy}
              onClick={() => void applyPromo()}
              style={{
                border: 'none',
                borderRadius: 16,
                padding: '0 20px',
                background: 'var(--brand)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: !promoInput.trim() || promoBusy ? 0.5 : 1,
              }}
            >
              {t('applyPromo')}
            </button>
          </div>
        )}
      </div>

      <div className="surface-row" style={{ marginTop: 20, padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>{t('total')}</div>
        <SummaryRow label={t('items')} value={String(cart?.itemCount ?? 0)} />
        <SummaryRow label={t('total')} value={cart ? formatPrice(cart.total, cart.currency) : ''} />
        {promo && (
          <SummaryRow
            label={t('discountLabel')}
            value={`-${formatPrice(promo.discountAmount, cart?.currency ?? '')}`}
          />
        )}
        <div
          style={{
            borderTop: '1px solid var(--tgui--secondary_bg_color)',
            margin: '8px 0',
          }}
        />
        <SummaryRow
          label={t('total')}
          value={cart ? formatPrice(finalTotal, cart.currency) : ''}
          bold
        />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0',
        fontSize: bold ? 16 : 14,
        fontWeight: bold ? 800 : 500,
        color: bold ? 'var(--tgui--text_color)' : 'var(--tgui--hint_color)',
      }}
    >
      <span>{label}</span>
      <span style={{ color: 'var(--tgui--text_color)', fontWeight: bold ? 800 : 700 }}>
        {value}
      </span>
    </div>
  );
}
