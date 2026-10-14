import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { miniApp, retrieveLaunchParams, useSignal } from '@telegram-apps/sdk-react';
import { AppRoot, Placeholder } from '@telegram-apps/telegram-ui';
import { SessionProvider, useSession } from './providers/SessionProvider.js';
import { CartProvider } from './providers/CartProvider.js';
import { LanguageProvider, useLang } from './i18n/LanguageProvider.js';
import { useBackButton } from './hooks/useBackButton.js';
import { Loader } from './components/Loader.js';
import { TabBar } from './components/TabBar.js';
import { CatalogPage } from './pages/CatalogPage.js';
import { ProductPage } from './pages/ProductPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { CartPage } from './pages/CartPage.js';
import { PaymentPage } from './pages/PaymentPage.js';
import { OrdersPage } from './pages/OrdersPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AdminPage } from './pages/AdminPage.js';

function platform(): 'ios' | 'base' {
  try {
    return retrieveLaunchParams().tgWebAppPlatform === 'ios' ? 'ios' : 'base';
  } catch {
    return 'base';
  }
}

function Shell(): React.JSX.Element {
  useBackButton();
  const { status, error } = useSession();
  const { t } = useLang();

  if (status === 'loading') return <Loader />;
  if (status === 'error') {
    return (
      <Placeholder header={t('couldNotSignIn')} description={error ?? t('pleaseReopen')}>
        <span style={{ fontSize: 48 }}>🔒</span>
      </Placeholder>
    );
  }

  return (
    <>
      <div style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/pay/:id" element={<PaymentPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <TabBar />
    </>
  );
}

export function App(): React.JSX.Element {
  const isDark = useSignal(miniApp.isDark);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <AppRoot appearance={isDark ? 'dark' : 'light'} platform={platform()}>
      <LanguageProvider>
        <SessionProvider>
          <CartProvider>
            <HashRouter>
              <Shell />
            </HashRouter>
          </CartProvider>
        </SessionProvider>
      </LanguageProvider>
    </AppRoot>
  );
}
