import {
  backButton,
  initData,
  init as initSDK,
  miniApp,
  setDebug,
  themeParams,
  viewport,
} from '@telegram-apps/sdk-react';

/**
 * Initializes the Telegram SDK (v3) and mounts the components the app relies on.
 * Each mount is guarded with `isSupported`/`isAvailable` so the call is a no-op
 * in environments where a feature is missing instead of throwing.
 */
export function init(debug: boolean): void {
  setDebug(debug);
  initSDK();

  // Restore initData state from the launch parameters.
  initData.restore();

  if (backButton.isSupported()) {
    backButton.mount();
  }

  if (miniApp.mountSync.isAvailable()) {
    miniApp.mountSync();
    miniApp.bindCssVars();
  }

  if (themeParams.mountSync.isAvailable()) {
    themeParams.mountSync();
    // Deliberately not calling themeParams.bindCssVars(): it would set
    // --tg-theme-* as inline styles on <html>, overriding our own brand
    // theme (src/theme.css) which Telegram UI reads via the same variables.
  }

  if (viewport.mount.isAvailable()) {
    void viewport.mount().then(() => {
      viewport.bindCssVars();
    });
  }
}
