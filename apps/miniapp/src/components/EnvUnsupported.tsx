import { AppRoot, Placeholder, Text } from '@telegram-apps/telegram-ui';

/** Shown when the app is opened outside a supported Telegram environment. */
export function EnvUnsupported({ detail }: { detail?: string }): React.JSX.Element {
  return (
    <AppRoot>
      <Placeholder
        header="Open in Telegram / Telegram orqali oching / Откройте в Telegram"
        description="This Mini App must be launched from a Telegram client. / Bu Mini App faqat Telegram ilovasi ichida ishlaydi. / Это Mini App работает только внутри приложения Telegram."
      >
        <span style={{ fontSize: 56 }}>📱</span>
      </Placeholder>
      {detail && (
        <div style={{ padding: 16, wordBreak: 'break-word' }}>
          <Text style={{ color: 'var(--tgui--hint_color)', fontSize: 12 }}>{detail}</Text>
        </div>
      )}
    </AppRoot>
  );
}
