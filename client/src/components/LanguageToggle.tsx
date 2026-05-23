import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nProvider';

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  const next = lang === 'en' ? 'ar' : 'en';
  const label = next === 'ar' ? t('lang.arabic') : t('lang.english');

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(next)}
      aria-label={t('lang.toggle')}
      // Western-digit/Arabic-script glyph always renders left-to-right inside the button;
      // letting the button itself follow document direction keeps icon/text order natural.
    >
      <span aria-hidden className="me-2">🌐</span>
      {label}
    </Button>
  );
}
