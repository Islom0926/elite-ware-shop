import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Section } from '@telegram-apps/telegram-ui';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSession } from '../providers/SessionProvider.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { ProductCard } from '../components/ProductCard.js';
import { BannerCarousel } from '../components/BannerCarousel.js';
import { useLang } from '../i18n/LanguageProvider.js';

export function CatalogPage(): React.JSX.Element {
  const { t } = useLang();
  const { user } = useSession();
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const categories = useAsync(() => api.getCategories(), []);
  const banners = useAsync(() => api.getBanners(), []);
  const products = useAsync(() => api.getProducts({ categoryId }), [categoryId]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 16px 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt=""
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="surface-row"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {(user?.firstName ?? 'E').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, color: 'var(--tgui--hint_color)' }}>
              {t('greetingLabel')}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{user?.firstName ?? 'Elite Ware'}</span>
          </div>
        </div>
        <img
          src="/logo.png"
          alt="Elite Ware Shop"
          style={{ width: 40, height: 40, borderRadius: 12 }}
        />
      </div>

      <button
        type="button"
        className="surface-row press-anim"
        onClick={() => navigate('/search')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: 'calc(100% - 32px)',
          margin: '14px 16px 0',
          padding: '13px 16px',
          border: 'none',
          color: 'var(--tgui--hint_color)',
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M20 20L16.5 16.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {t('searchPlaceholder')}
      </button>

      {banners.data && banners.data.length > 0 && <BannerCarousel banners={banners.data} />}

      {categories.data && categories.data.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '16px 16px 4px',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            className="press-anim"
            onClick={() => setCategoryId(undefined)}
            style={{
              flexShrink: 0,
              border: 'none',
              borderRadius: 'var(--pill-radius)',
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: categoryId === undefined ? 'var(--brand)' : 'var(--chip-bg)',
              color: categoryId === undefined ? '#fff' : 'var(--tgui--hint_color)',
            }}
          >
            {t('all')}
          </button>
          {categories.data.map((category) => (
            <button
              key={category.id}
              type="button"
              className="press-anim"
              onClick={() => setCategoryId(category.id)}
              style={{
                flexShrink: 0,
                border: 'none',
                borderRadius: 'var(--pill-radius)',
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: categoryId === category.id ? 'var(--brand)' : 'var(--chip-bg)',
                color: categoryId === category.id ? '#fff' : 'var(--tgui--hint_color)',
              }}
            >
              {category.title}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '16px 16px 4px', fontSize: 18, fontWeight: 800 }}>{t('catalog')}</div>

      {products.loading && <Loader />}
      {products.error && <ErrorView message={products.error} />}
      {products.data &&
        (products.data.items.length === 0 ? (
          <Section>
            <Cell>{t('noProductsFound')}</Cell>
          </Section>
        ) : (
          <div
            className="fade-up"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              padding: '8px 16px 24px',
            }}
          >
            {products.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ))}
    </div>
  );
}
