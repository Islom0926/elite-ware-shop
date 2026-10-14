import { Placeholder } from '@telegram-apps/telegram-ui';
import { useLang } from '../i18n/LanguageProvider.js';

export function ErrorView({ message }: { message: string }): React.JSX.Element {
  const { t } = useLang();
  return (
    <Placeholder header={t('somethingWentWrong')} description={message}>
      <span style={{ fontSize: 48 }}>😕</span>
    </Placeholder>
  );
}
