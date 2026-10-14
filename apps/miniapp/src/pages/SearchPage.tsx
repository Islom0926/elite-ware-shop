import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Placeholder } from '@telegram-apps/telegram-ui';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { ProductCard } from '../components/ProductCard.js';
import { useLang } from '../i18n/LanguageProvider.js';

export function SearchPage(): React.JSX.Element {
  const { t } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  const results = useAsync(
    () => (trimmed ? api.getProducts({ search: trimmed, limit: 50 }) : Promise.resolve(null)),
    [trimmed],
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 0' }}>
        <button type="button" className="chip-btn press-anim" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div
          className="surface-row"
          style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: '12px 16px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="var(--tgui--hint_color)" strokeWidth="1.8" />
            <path
              d="M20 20L16.5 16.5"
              stroke="var(--tgui--hint_color)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <input
            autoFocus
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'none',
              fontSize: 15,
              color: 'var(--tgui--text_color)',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--tgui--hint_color)',
                cursor: 'pointer',
                fontSize: 16,
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {trimmed && results.data && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 16px 0',
            fontSize: 13,
            color: 'var(--tgui--hint_color)',
          }}
        >
          <span>
            {t('searchResultsFor')} “{trimmed}”
          </span>
          <span style={{ color: 'var(--brand)', fontWeight: 700 }}>
            {t('resultsFoundLabel', { count: results.data.total })}
          </span>
        </div>
      )}

      {!trimmed && (
        <Placeholder description={t('searchHint')}>
          <span style={{ fontSize: 40 }}>🔍</span>
        </Placeholder>
      )}

      {results.loading && <Loader />}
      {results.error && <ErrorView message={results.error} />}
      {results.data &&
        (results.data.items.length === 0 ? (
          <Placeholder description={t('noProductsFound')}>
            <span style={{ fontSize: 40 }}>🙁</span>
          </Placeholder>
        ) : (
          <div
            className="fade-up"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              padding: '12px 16px 24px',
            }}
          >
            {results.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ))}
    </div>
  );
}
