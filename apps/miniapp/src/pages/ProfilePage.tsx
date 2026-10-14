import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Cell, List, Section, Textarea } from '@telegram-apps/telegram-ui';
import { api, ApiClientError } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSession } from '../providers/SessionProvider.js';
import { formatPrice } from '../lib/format.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { useLang } from '../i18n/LanguageProvider.js';
import { LANGS } from '../i18n/translations.js';

export function ProfilePage(): React.JSX.Element {
  const { user, isAdmin } = useSession();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();

  const orders = useAsync(() => api.getOrders(), []);
  const rank = useAsync(() => api.getRank(), []);
  const shop = useAsync(() => api.getShop(), []);
  const [reloadKey, setReloadKey] = useState(0);
  const profile = useAsync(() => api.getProfile(), [reloadKey]);

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
    <List>
      <div
        className="glass pop-in"
        style={{
          margin: '20px 16px 0',
          borderRadius: 20,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt=""
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--tgui--secondary_bg_color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {user.firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>
            {[user.firstName, user.lastName].filter(Boolean).join(' ')}
          </span>
          {user.username && (
            <span style={{ fontSize: 13, color: 'var(--tgui--hint_color)' }}>@{user.username}</span>
          )}
          <span style={{ fontSize: 12, color: 'var(--tgui--hint_color)' }}>
            ID: {user.telegramId}
          </span>
        </div>
      </div>

      <div className="fade-up" style={{ display: 'flex', gap: 10, margin: '12px 16px 0' }}>
        <div className="glass" style={{ flex: 1, borderRadius: 16, padding: '12px 14px' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {rank.data?.rank ? `#${rank.data.rank}` : '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)' }}>{t('topRankLabel')}</div>
        </div>
        <div className="glass" style={{ flex: 1, borderRadius: 16, padding: '12px 14px' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{doneCount}</div>
          <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)' }}>
            {t('completedOrdersLabel')}
          </div>
        </div>
        <div className="glass" style={{ flex: 1, borderRadius: 16, padding: '12px 14px' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{pendingCount}</div>
          <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)' }}>
            {t('pendingOrdersLabel')}
          </div>
        </div>
      </div>

      {rank.data && rank.data.totalSpent > 0 && shop.data && (
        <Section>
          <Cell after={formatPrice(rank.data.totalSpent, shop.data.currency)}>
            {t('totalSpentLabel')}
          </Cell>
        </Section>
      )}

      <Section header={t('myOrdersHeader')}>
        {orders.loading && <Loader />}
        {orders.error && <ErrorView message={orders.error} />}
        <Cell onClick={() => navigate('/orders')} after="›">
          {t('viewAllOrders')}
        </Cell>
      </Section>

      <Section header={t('addressHeader')}>
        <Textarea
          placeholder={t('addressPlaceholder')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div style={{ padding: 16 }}>
          <Button stretched loading={savingAddress} onClick={() => void saveAddress()}>
            {t('saveAddress')}
          </Button>
          {addressMessage && <Cell>{addressMessage}</Cell>}
        </div>
      </Section>

      <Section header={t('languageHeader')}>
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

      {isAdmin && (
        <Section>
          <Cell onClick={() => navigate('/admin')} after="›">
            {t('admin')}
          </Cell>
        </Section>
      )}
    </List>
  );
}
