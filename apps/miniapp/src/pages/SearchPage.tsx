import { useState } from 'react';
import { Input, List, Placeholder, Section } from '@telegram-apps/telegram-ui';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { ProductCard } from '../components/ProductCard.js';
import { useLang } from '../i18n/LanguageProvider.js';

export function SearchPage(): React.JSX.Element {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  const results = useAsync(
    () => (trimmed ? api.getProducts({ search: trimmed, limit: 50 }) : Promise.resolve(null)),
    [trimmed],
  );

  return (
    <List>
      <div style={{ padding: '20px 16px 8px' }}>
        <Input
          autoFocus
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!trimmed && (
        <Placeholder description={t('searchHint')}>
          <span style={{ fontSize: 40 }}>🔍</span>
        </Placeholder>
      )}

      {results.loading && <Loader />}
      {results.error && <ErrorView message={results.error} />}
      {results.data &&
        (results.data.items.length === 0 ? (
          <Section>
            <Placeholder description={t('noProductsFound')}>
              <span style={{ fontSize: 40 }}>🙁</span>
            </Placeholder>
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
            {results.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ))}
    </List>
  );
}
