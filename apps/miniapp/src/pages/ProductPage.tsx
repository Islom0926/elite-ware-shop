import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useCart } from '../providers/CartProvider.js';
import { useMainButton } from '../hooks/useMainButton.js';
import { formatPrice } from '../lib/format.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { useLang } from '../i18n/LanguageProvider.js';
import { isFavorite, toggleFavorite } from '../lib/favorites.js';

export function ProductPage(): React.JSX.Element {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { t } = useLang();
  const [adding, setAdding] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [favoriteSyncedFor, setFavoriteSyncedFor] = useState<string | null>(null);

  const { data: product, loading, error } = useAsync(() => api.getProduct(id), [id]);
  const outOfStock = product?.stock !== null && product !== null && (product?.stock ?? 0) <= 0;

  if (product && favoriteSyncedFor !== product.id) {
    setFavorite(isFavorite(product.id));
    setFavoriteSyncedFor(product.id);
  }

  const onAdd = useCallback(async () => {
    if (!product) return;
    setAdding(true);
    try {
      await add(product.id, 1);
      navigate('/cart');
    } finally {
      setAdding(false);
    }
  }, [product, add, navigate]);

  useMainButton({
    text: outOfStock ? t('outOfStock') : t('addToCart'),
    visible: Boolean(product),
    enabled: !outOfStock,
    loading: adding,
    onClick: onAdd,
  });

  if (loading) return <Loader />;
  if (error || !product) return <ErrorView message={error ?? t('productNotFound')} />;

  return (
    <div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: 'var(--chip-bg)',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          overflow: 'hidden',
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
              fontSize: 64,
            }}
          >
            🛍️
          </div>
        )}
        <button
          type="button"
          className="chip-btn press-anim"
          onClick={() => navigate(-1)}
          style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.92)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#16171b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="chip-btn press-anim"
          onClick={() => setFavorite(toggleFavorite(product.id))}
          aria-label={t('favoriteLabel')}
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.92)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s-7.5-4.6-10-9.1C.6 8.6 2 5 5.4 4.2 8 3.6 10.3 5 12 7.3 13.7 5 16 3.6 18.6 4.2 22 5 23.4 8.6 22 11.9 19.5 16.4 12 21 12 21z"
              fill={favorite ? '#ff5a6a' : 'none'}
              stroke={favorite ? '#ff5a6a' : '#16171b'}
              strokeWidth="1.8"
            />
          </svg>
        </button>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, fontWeight: 800, flex: 1, marginRight: 12 }}>
            {product.title}
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>
            {formatPrice(product.price, product.currency)}
          </span>
        </div>

        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--tgui--hint_color)' }}>
          {product.stock === null ? t('inStock') : t('leftStock', { count: product.stock })}
        </div>

        {product.description && (
          <>
            <div style={{ marginTop: 20, fontSize: 16, fontWeight: 800 }}>
              {t('descriptionLabel')}
            </div>
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--tgui--hint_color)',
              }}
            >
              {product.description}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
