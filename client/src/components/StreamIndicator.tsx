import { useT } from '@/i18n/I18nProvider';

export function StreamIndicator({ connected }: { connected: boolean }) {
  const t = useT();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={
          'relative inline-flex h-2 w-2 rounded-full ' +
          (connected ? 'bg-emerald-500' : 'bg-slate-400')
        }
        aria-hidden
      >
        {connected && (
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
        )}
      </span>
      {connected ? t('stream.live') : t('stream.offline')}
    </span>
  );
}
