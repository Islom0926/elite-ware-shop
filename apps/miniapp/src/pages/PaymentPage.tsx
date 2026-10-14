import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Cell, List, Placeholder, Section, Text } from '@telegram-apps/telegram-ui';
import { api, ApiClientError } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatPrice } from '../lib/format.js';
import { fileToCompressedDataUrl } from '../lib/image.js';
import { Loader } from '../components/Loader.js';
import { ErrorView } from '../components/ErrorView.js';
import { useLang } from '../i18n/LanguageProvider.js';

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
    <List>
      <Section header={t('payHeader')}>
        <Cell after={formatPrice(order.total, order.currency)}>{t('amountToPay')}</Cell>
        {shop?.cardNumber ? (
          <>
            <Cell subtitle={t('cardNumberLabel')} multiline>
              {shop.cardNumber}
            </Cell>
            {shop.cardHolder && (
              <Cell subtitle={t('cardHolderLabel')} multiline>
                {shop.cardHolder}
              </Cell>
            )}
            {shop.paymentInstructions && (
              <div style={{ padding: '8px 16px' }}>
                <Text style={{ color: 'var(--tgui--hint_color)' }}>{shop.paymentInstructions}</Text>
              </div>
            )}
          </>
        ) : (
          <Placeholder description={t('noCardConfigured')}>
            <span style={{ fontSize: 40 }}>💳</span>
          </Placeholder>
        )}
      </Section>

      {shop?.cardNumber && (
        <Section header={t('uploadReceiptLabel')}>
          {error && <Cell style={{ color: 'var(--tgui--destructive_text_color)' }}>{error}</Cell>}
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
          <div style={{ padding: 16 }}>
            <Button stretched loading={busy} onClick={() => fileInputRef.current?.click()}>
              {t('chooseFile')}
            </Button>
          </div>
        </Section>
      )}
    </List>
  );
}
