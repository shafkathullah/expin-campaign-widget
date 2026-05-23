import { Toaster } from 'sonner';
import { useI18n } from '@/i18n/I18nProvider';

export function AppToaster() {
  const { dir } = useI18n();
  return (
    <Toaster
      position={dir === 'rtl' ? 'top-left' : 'top-right'}
      richColors
      dir={dir}
    />
  );
}
