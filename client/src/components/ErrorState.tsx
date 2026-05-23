import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
};

export function ErrorState({ title, body, retryLabel, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
    >
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden />
      <div>
        <h3 className="text-base font-semibold text-destructive">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 gap-1.5">
        <RotateCw className="h-3.5 w-3.5" aria-hidden />
        {retryLabel}
      </Button>
    </div>
  );
}
