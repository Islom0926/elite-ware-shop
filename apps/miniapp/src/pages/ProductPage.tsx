import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useCart } from '../providers/CartProvider.js';
import { useMainButton } from '../hooks/useMainButton.js';
import { formatPrice } from '../lib/format.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { ImageLightbox } from '../components/ImageLightbox.js';
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
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const { data: product, loading, error } = useAsync(() => api.getProduct(id), [id]);
  const outOfStock = product?.stock !== null && product !== null && (product?.stock ?? 0) <= 0;

  const images = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set([product.imageUrl, ...product.images].filter(Boolean))) as string[];
  }, [product]);

  if (product && favoriteSyncedFor !== product.id) {
    setFavorite(isFavorite(product.id));
    setFavoriteSyncedFor(product.id);
  }

  const pickColor = (colorName: string, colorImage: string | null): void => {
    setSelectedColor(colorName);
    if (colorImage) {
      const idx = images.indexOf(colorImage);
      if (idx >= 0) setActiveImage(idx);
    }
  };

  const needsColor = (product?.colors.length ?? 0) > 0 && !selectedColor;
  const needsSize = (product?.sizes.length ?? 0) > 0 && !selectedSize;
  const canAdd = !outOfStock && !needsColor && !needsSize;

  const onAdd = useCallback(async () => {
    if (!product || !canAdd) return;
    setAdding(true);
    try {
      await add(product.id, 1, selectedColor, selectedSize);
      navigate('/cart');
    } finally {
      setAdding(false);
    }
  }, [product, canAdd, add, selectedColor, selectedSize, navigate]);

  useMainButton({
    text: outOfStock
      ? t('outOfStock')
      : needsColor
        ? t('chooseColorFirst')
        : needsSize
          ? t('chooseSizeFirst')
          : t('addToCart'),
    visible: Boolean(product),
    enabled: canAdd,
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
        onClick={() => images.length > 0 && setLightboxOpen(true)}
      >
        {images[activeImage] ? (
          <img
            src={images[activeImage]}
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
          onClick={(e) => {
            e.stopPropagation();
            navigate(-1);
          }}
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
          onClick={(e) => {
            e.stopPropagation();
            setFavorite(toggleFavorite(product.id));
          }}
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

      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0', overflowX: 'auto' }}>
          {images.map((img, i) => (
            <button
              key={img.slice(0, 32) + i}
              type="button"
              className="press-anim"
              onClick={() => setActiveImage(i)}
              style={{
                flexShrink: 0,
                width: 56,
                height: 56,
                borderRadius: 14,
                overflow: 'hidden',
                border: i === activeImage ? '2px solid var(--brand)' : '2px solid transparent',
                padding: 0,
                cursor: 'pointer',
                background: 'var(--chip-bg)',
              }}
            >
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

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

        {product.colors.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>
              {t('colorLabel')}
              {selectedColor ? `: ${selectedColor}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className="press-anim"
                  onClick={() => pickColor(c.name, c.imageUrl)}
                  style={{
                    flexShrink: 0,
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    overflow: 'hidden',
                    border:
                      selectedColor === c.name
                        ? '2px solid var(--brand)'
                        : '1px solid var(--chip-bg)',
                    padding: 0,
                    cursor: 'pointer',
                    background: 'var(--chip-bg)',
                  }}
                  aria-label={c.name}
                >
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{c.name.slice(0, 3)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.sizes.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>
              {t('sizeLabel')}
              {selectedSize ? `: ${selectedSize}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className="press-anim"
                  onClick={() => setSelectedSize(size)}
                  style={{
                    border: 'none',
                    borderRadius: 'var(--pill-radius)',
                    padding: '9px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: selectedSize === size ? 'var(--brand)' : 'var(--chip-bg)',
                    color: selectedSize === size ? '#fff' : 'var(--tgui--text_color)',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

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

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          index={activeImage}
          onIndexChange={setActiveImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
