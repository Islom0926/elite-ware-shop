import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Placeholder } from '@telegram-apps/telegram-ui';
import { api, ApiClientError } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatPrice } from '../lib/format.js';
import { fileToCompressedDataUrl } from '../lib/image.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { useLang } from '../i18n/LanguageProvider.js';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div
      className="surface-row"
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}
    >
      <div className="chip-btn" style={{ width: 36, height: 36, fontSize: 16 }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 12, color: 'var(--tgui--hint_color)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{value}</span>
      </div>
    </div>
  );
}

export function PaymentPage(): React.JSX.Element {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: order,
    loading: orderLoading,
    error: orderError,
  } = useAsync(() => api.getOrder(id), [id]);
  const { data: shop, loading: shopLoading } = useAsync(() => api.getShop(), []);

  const onFileChosen = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        const imageData = await fileToCompressedDataUrl(file);
        await api.submitReceipt(id, imageData);
        navigate('/orders');
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : t('receiptSubmitFailed'));
      } finally {
        setBusy(false);
      }
    },
    [id, navigate, t],
  );

  if (orderLoading || shopLoading) return <Loader />;
  if (orderError || !order) return <ErrorView message={orderError ?? t('productNotFound')} />;

  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{t('payHeader')}</div>

      <div className="card-surface" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--tgui--hint_color)', fontSize: 14 }}>{t('amountToPay')}</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--brand)' }}>
            {formatPrice(order.total, order.currency)}
          </span>
        </div>
      </div>

      {shop?.cardNumber ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow icon="💳" label={t('cardNumberLabel')} value={shop.cardNumber} />
            {shop.cardHolder && (
              <InfoRow icon="👤" label={t('cardHolderLabel')} value={shop.cardHolder} />
            )}
          </div>
          {shop.paymentInstructions && (
            <p style={{ color: 'var(--tgui--hint_color)', fontSize: 13, marginTop: 12 }}>
              {shop.paymentInstructions}
            </p>
          )}

          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>{t('uploadReceiptLabel')}</div>
            {error && (
              <div style={{ color: 'var(--tgui--destructive_text_color)', marginBottom: 10 }}>
                {error}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFileChosen(file);
              }}
            />
            <button
              type="button"
              className="pill-btn press-anim"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              {busy ? '…' : t('chooseFile')}
            </button>
          </div>
        </>
      ) : (
        <Placeholder description={t('noCardConfigured')}>
          <span style={{ fontSize: 40 }}>💳</span>
        </Placeholder>
      )}
    </div>
  );
}
