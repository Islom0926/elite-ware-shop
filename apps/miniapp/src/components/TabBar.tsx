import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../providers/CartProvider.js';
import { useLang } from '../i18n/LanguageProvider.js';

interface Tab {
  path: string;
  icon: string;
  labelKey: 'tabHome' | 'tabSearch' | 'tabCart' | 'tabProfile';
}

const TABS: Tab[] = [
  { path: '/', icon: '🏠', labelKey: 'tabHome' },
  { path: '/search', icon: '🔍', labelKey: 'tabSearch' },
  { path: '/cart', icon: '🛒', labelKey: 'tabCart' },
  { path: '/profile', icon: '👤', labelKey: 'tabProfile' },
];

export function TabBar(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { t } = useLang();

  return (
    <nav
      className="glass"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 8px calc(8px + env(safe-area-inset-bottom))',
        zIndex: 50,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
      }}
    >
      {TABS.map((tab) => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            type="button"
            className="press-anim"
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              border: 'none',
              background: 'none',
              padding: '4px 14px',
              cursor: 'pointer',
              color: active ? 'var(--tgui--accent_text_color)' : 'var(--tgui--hint_color)',
              position: 'relative',
            }}
          >
            <span className={active ? 'pop-in' : undefined} style={{ fontSize: 22, lineHeight: 1 }}>
              {tab.icon}
            </span>
            {tab.path === '/cart' && itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: 6,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 999,
                  background: 'var(--tgui--destructive_text_color)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {itemCount}
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
