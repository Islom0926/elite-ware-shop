import { useNavigate } from 'react-router-dom';
import { Cell } from '@telegram-apps/telegram-ui';
import type { Product } from '@tma-shop/shared';
import { formatPrice } from '../lib/format.js';
import { useLang } from '../i18n/LanguageProvider.js';

export function ProductCard({ product }: { product: Product }): React.JSX.Element {
  const navigate = useNavigate();
  const { t } = useLang();
  const outOfStock = product.stock !== null && product.stock <= 0;

  return (
    <Cell
      onClick={() => navigate(`/product/${product.id}`)}
      subtitle={product.description}
      after={formatPrice(product.price, product.currency)}
      hint={outOfStock ? t('outOfStock') : undefined}
      multiline
    >
      {product.title}
    </Cell>
  );
}
