import { useState } from 'react';
import { Button, Cell, Input, List, Section } from '@telegram-apps/telegram-ui';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { ProductCard } from '../components/ProductCard.js';
import { BannerCarousel } from '../components/BannerCarousel.js';
import { useLang } from '../i18n/LanguageProvider.js';
import { LANGS } from '../i18n/translations.js';

export function CatalogPage(): React.JSX.Element {
  const { t, lang, setLang } = useLang();
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const categories = useAsync(() => api.getCategories(), []);
  const banners = useAsync(() => api.getBanners(), []);
  const products = useAsync(
    () => api.getProducts({ categoryId, search: search.trim() || undefined }),
    [categoryId, search],
  );

  return (
    <List>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 16px 8px',
          gap: 8,
        }}
      >
        <img
          src="/logo.png"
          alt="Elite Ware Shop"
          style={{ width: 88, height: 88, borderRadius: 16 }}
        />
      </div>

      {banners.data && banners.data.length > 0 && <BannerCarousel banners={banners.data} />}

      <Section>
        <div style={{ display: 'flex', gap: 8, padding: '8px 16px', flexWrap: 'wrap' }}>
          {LANGS.map(({ code, label }) => (
            <Button
              key={code}
              size="s"
              mode={lang === code ? 'filled' : 'bezeled'}
              onClick={() => setLang(code)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Section>

      <Section header={t('catalog')}>
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, padding: '8px 16px', flexWrap: 'wrap' }}>
          <Button
            size="s"
            mode={categoryId === undefined ? 'filled' : 'bezeled'}
            onClick={() => setCategoryId(undefined)}
          >
            {t('all')}
          </Button>
          {categories.data?.map((category) => (
            <Button
              key={category.id}
              size="s"
              mode={categoryId === category.id ? 'filled' : 'bezeled'}
              onClick={() => setCategoryId(category.id)}
            >
              {category.title}
            </Button>
          ))}
        </div>
      </Section>

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
              gap: 10,
              padding: '8px 16px 24px',
            }}
          >
            {products.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ))}
    </List>
  );
}
