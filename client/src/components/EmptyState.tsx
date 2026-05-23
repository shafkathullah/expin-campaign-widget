import { Inbox, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  variant: 'no-creators' | 'no-results';
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ variant, title, body, action }: Props) {
  const Icon = variant === 'no-creators' ? Inbox : SearchX;
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card px-6 py-16 text-center">
      <Icon className="h-10 w-10 text-muted-foreground" aria-hidden />
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
