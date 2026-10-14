import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Textarea } from '@telegram-apps/telegram-ui';
import { api, ApiClientError } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSession } from '../providers/SessionProvider.js';
import { formatPrice } from '../lib/format.js';
import { Loader } from '../components/Loader.js';
import { useLang } from '../i18n/LanguageProvider.js';
import { LANGS } from '../i18n/translations.js';

function RowIcon({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div
      className="chip-btn"
      style={{ width: 36, height: 36, fontSize: 16, color: 'var(--tgui--text_color)' }}
    >
      {children}
    </div>
  );
}

function ListRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | undefined;
  onClick?: (() => void) | undefined;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="surface-row press-anim"
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        border: 'none',
        padding: '12px 14px',
        cursor: onClick ? 'pointer' : 'default',
        font: 'inherit',
        color: 'inherit',
        textAlign: 'left',
      }}
    >
      <RowIcon>{icon}</RowIcon>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{label}</span>
      {value && <span style={{ fontSize: 13, color: 'var(--tgui--hint_color)' }}>{value}</span>}
      {onClick && <span style={{ color: 'var(--tgui--hint_color)', fontSize: 16 }}>›</span>}
    </button>
  );
}

export function ProfilePage(): React.JSX.Element {
  const { user, isAdmin } = useSession();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();

  const orders = useAsync(() => api.getOrders(), []);
  const rank = useAsync(() => api.getRank(), []);
  const shop = useAsync(() => api.getShop(), []);
  const [reloadKey, setReloadKey] = useState(0);
  const profile = useAsync(() => api.getProfile(), [reloadKey]);

  const [addressOpen, setAddressOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [addressInitialized, setAddressInitialized] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);

  if (profile.data && !addressInitialized) {
    setAddress(profile.data.address ?? '');
    setAddressInitialized(true);
  }

  const saveAddress = async (): Promise<void> => {
    setSavingAddress(true);
    setAddressMessage(null);
    try {
      await api.updateAddress(address.trim() || null);
      setAddressMessage(t('settingsSaved'));
      setReloadKey((k) => k + 1);
    } catch (err) {
      setAddressMessage(err instanceof ApiClientError ? err.message : t('saveSettingsFailed'));
    } finally {
      setSavingAddress(false);
    }
  };

  if (!user) return <Loader />;

  const pendingCount =
    orders.data?.filter((o) => o.status === 'pending' || o.status === 'awaiting_payment').length ??
    0;
  const doneCount =
    orders.data?.filter((o) => o.status === 'paid' || o.status === 'fulfilled').length ?? 0;

  return (
    <div style={{ padding: '24px 16px' }}>
      <div
        className="pop-in"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
      >
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt=""
            style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            className="chip-btn"
            style={{
              width: 84,
              height: 84,
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            {user.firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ fontSize: 19, fontWeight: 800 }}>
          {[user.firstName, user.lastName].filter(Boolean).join(' ')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--tgui--hint_color)' }}>
          {user.username ? `@${user.username}` : `ID: ${user.telegramId}`}
        </div>
      </div>

      <div className="fade-up" style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <div
          className="card-surface"
          style={{ flex: 1, padding: '14px 12px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)' }}>
            {rank.data?.rank ? `#${rank.data.rank}` : '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)', marginTop: 2 }}>
            {t('topRankLabel')}
          </div>
        </div>
        <div
          className="card-surface"
          style={{ flex: 1, padding: '14px 12px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 20, fontWeight: 800 }}>{doneCount}</div>
          <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)', marginTop: 2 }}>
            {t('completedOrdersLabel')}
          </div>
        </div>
        <div
          className="card-surface"
          style={{ flex: 1, padding: '14px 12px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 20, fontWeight: 800 }}>{pendingCount}</div>
          <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)', marginTop: 2 }}>
            {t('pendingOrdersLabel')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
        <ListRow icon="📦" label={t('viewAllOrders')} onClick={() => navigate('/orders')} />
        {rank.data && rank.data.totalSpent > 0 && shop.data && (
          <ListRow
            icon="💰"
            label={t('totalSpentLabel')}
            value={formatPrice(rank.data.totalSpent, shop.data.currency)}
          />
        )}
        <ListRow
          icon="📍"
          label={t('addressHeader')}
          value={address || undefined}
          onClick={() => setAddressOpen((v) => !v)}
        />
        {addressOpen && (
          <div className="card-surface" style={{ padding: 14 }}>
            <Textarea
              placeholder={t('addressPlaceholder')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div style={{ marginTop: 12 }}>
              <Button stretched loading={savingAddress} onClick={() => void saveAddress()}>
                {t('saveAddress')}
              </Button>
              {addressMessage && (
                <div style={{ marginTop: 8, fontSize: 13, textAlign: 'center' }}>
                  {addressMessage}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card-surface" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <RowIcon>🌐</RowIcon>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t('languageHeader')}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                className="press-anim"
                onClick={() => setLang(code)}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 'var(--pill-radius)',
                  padding: '8px 0',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: lang === code ? 'var(--brand)' : 'var(--chip-bg)',
                  color: lang === code ? '#fff' : 'var(--tgui--hint_color)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isAdmin && <ListRow icon="🛠️" label={t('admin')} onClick={() => navigate('/admin')} />}
      </div>
    </div>
  );
}
