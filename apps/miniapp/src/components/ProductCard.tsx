import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@tma-shop/shared';
import { formatPrice } from '../lib/format.js';
import { useLang } from '../i18n/LanguageProvider.js';
import { useCart } from '../providers/CartProvider.js';
import { isFavorite, toggleFavorite } from '../lib/favorites.js';

export function ProductCard({ product }: { product: Product }): React.JSX.Element {
  const navigate = useNavigate();
  const { t } = useLang();
  const { add } = useCart();
  const [favorite, setFavorite] = useState(() => isFavorite(product.id));
  const [adding, setAdding] = useState(false);
  const outOfStock = product.stock !== null && product.stock <= 0;
  const hasVariants = product.colors.length > 0 || product.sizes.length > 0;

  const onBuyNow = async (e: React.MouseEvent): Promise<void> => {
    if (outOfStock || adding) return;
    if (hasVariants) return; // let the click bubble to open the product page for selection
    e.stopPropagation();
    setAdding(true);
    try {
      await add(product.id, 1);
      navigate('/cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="card-surface press-anim"
      onClick={() => navigate(`/product/${product.id}`)}
      style={{ overflow: 'hidden', cursor: 'pointer' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: 'var(--chip-bg)',
        }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            🛍️
          </div>
        )}
        <button
          type="button"
          className="press-anim"
          onClick={(e) => {
            e.stopPropagation();
            setFavorite(toggleFavorite(product.id));
          }}
          aria-label={t('favoriteLabel')}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s-7.5-4.6-10-9.1C.6 8.6 2 5 5.4 4.2 8 3.6 10.3 5 12 7.3 13.7 5 16 3.6 18.6 4.2 22 5 23.4 8.6 22 11.9 19.5 16.4 12 21 12 21z"
              fill={favorite ? '#ff5a6a' : 'none'}
              stroke={favorite ? '#ff5a6a' : '#16171b'}
              strokeWidth="1.8"
            />
          </svg>
        </button>
        {outOfStock && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              background: 'var(--tgui--destructive_text_color)',
              color: '#fff',
            }}
          >
            {t('outOfStock')}
          </span>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.title}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)' }}>
          {formatPrice(product.price, product.currency)}
        </span>
        {!outOfStock && (
          <button
            type="button"
            className="pill-btn press-anim"
            onClick={(e) => void onBuyNow(e)}
            style={{ padding: '9px 0', fontSize: 13, marginTop: 2 }}
          >
            {adding ? '…' : t('buyNow')}
          </button>
        )}
      </div>
    </div>
  );
}
