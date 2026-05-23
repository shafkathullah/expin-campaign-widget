import { CampaignWidget } from './components/CampaignWidget';
import { LanguageToggle } from './components/LanguageToggle';
import { useT } from './i18n/I18nProvider';

const CAMPAIGN_ID = 'demo';

export default function App() {
  const t = useT();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {t('header.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              {t('header.subtitle')}
            </p>
          </div>
          <LanguageToggle />
        </header>

        <CampaignWidget campaignId={CAMPAIGN_ID} />
      </div>
    </main>
  );
}
