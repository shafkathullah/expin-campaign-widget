import { Skeleton } from '@/components/ui/skeleton';

const COLS = 6;
const ROWS = 8;

export function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full">
        <tbody>
          {Array.from({ length: ROWS }).map((_, r) => (
            <tr key={r} className="border-b last:border-0">
              {Array.from({ length: COLS }).map((_, c) => (
                <td key={c} className="px-3 py-3">
                  <Skeleton className={c === 0 ? 'h-4 w-40' : 'h-4 w-16 ms-auto'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
