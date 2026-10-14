import { useNavigate } from 'react-router-dom';
import type { Product } from '@tma-shop/shared';
import { formatPrice } from '../lib/format.js';
import { useLang } from '../i18n/LanguageProvider.js';

export function ProductCard({ product }: { product: Product }): React.JSX.Element {
  const navigate = useNavigate();
  const { t } = useLang();
  const outOfStock = product.stock !== null && product.stock <= 0;

  return (
    <button
      type="button"
      className="press-anim"
      onClick={() => navigate(`/product/${product.id}`)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        border: 'none',
        borderRadius: 14,
        background: 'var(--tgui--section_bg_color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: 0,
        font: 'inherit',
        color: 'inherit',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: 'var(--tgui--secondary_bg_color)',
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
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tgui--accent_text_color)' }}>
          {formatPrice(product.price, product.currency)}
        </span>
      </div>
    </button>
  );
}
