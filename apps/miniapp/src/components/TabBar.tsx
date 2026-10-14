import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../providers/CartProvider.js';
import { useLang } from '../i18n/LanguageProvider.js';

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps): React.JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6.5H9V21H4a1 1 0 0 1-1-1z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ active }: IconProps): React.JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon({ active }: IconProps): React.JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 8h12l1 12.5a1 1 0 0 1-1 1.5H6a1 1 0 0 1-1-1.5z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ProfileIcon({ active }: IconProps): React.JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 20c1.3-3.7 4.3-5.5 7.5-5.5s6.2 1.8 7.5 5.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface Tab {
  path: string;
  Icon: (props: IconProps) => React.JSX.Element;
  labelKey: 'tabHome' | 'tabSearch' | 'tabCart' | 'tabProfile';
}

const TABS: Tab[] = [
  { path: '/', Icon: HomeIcon, labelKey: 'tabHome' },
  { path: '/search', Icon: SearchIcon, labelKey: 'tabSearch' },
  { path: '/cart', Icon: BagIcon, labelKey: 'tabCart' },
  { path: '/profile', Icon: ProfileIcon, labelKey: 'tabProfile' },
];

export function TabBar(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { t } = useLang();

  return (
    <nav
      className="card-surface"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'calc(10px + env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '12px 8px',
        zIndex: 50,
        borderRadius: 28,
      }}
    >
      {TABS.map(({ path, Icon, labelKey }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            type="button"
            className="press-anim"
            aria-label={t(labelKey)}
            onClick={() => navigate(path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'none',
              padding: 8,
              cursor: 'pointer',
              color: active ? 'var(--brand)' : 'var(--tgui--hint_color)',
              position: 'relative',
            }}
          >
            <span className={active ? 'pop-in' : undefined} style={{ display: 'flex' }}>
              <Icon active={active} />
            </span>
            {path === '/cart' && itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
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
          </button>
        );
      })}
    </nav>
  );
}
