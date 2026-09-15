import Link from 'next/link';
import { list, escapeFormula } from '@/lib/airtable';
import { searchFormula } from '@/lib/search-formula';
import { TASK_STATUSES, type TaskFields } from '@/lib/types';
import { statusMeta } from '@/lib/status';
import { Header } from '@/components/shell/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TaskList } from './task-list';

export const dynamic = 'force-dynamic';

type SP = { status?: string; q?: string };

export default async function TasksPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { status: requested = '', q = '' } = await searchParams;
  const status = (TASK_STATUSES as readonly string[]).includes(requested) ? requested : '';

  const filters: string[] = [];
  if (status) filters.push(`{Status}='${escapeFormula(status)}'`);
  const search = searchFormula(['Title', 'RefId'], q);
  if (search) filters.push(search);
  const tasks = await list<TaskFields>('Tasks', { filter: filters.length ? `AND(${filters.join(',')})` : undefined });

  const href = (s: string) => `/tasks?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(q ? { q } : {}) })}`.replace(/\?$/, '');

  return (
    <>
      <Header title="משימות" />

      <form className="flex flex-wrap items-center gap-2 mb-3" role="search">
        <input type="hidden" name="status" value={status} />
        <Input name="q" defaultValue={q} placeholder="חיפוש לפי כותרת או מזהה" className="max-w-xs" aria-label="חיפוש" />
        <Button type="submit" variant="secondary">
          חיפוש
        </Button>
        {q && (
          <Link href={status ? `/tasks?status=${status}` : '/tasks'} className="text-ink-2 hover:text-ink text-sm">
            נקה
          </Link>
        )}
      </form>

      <nav aria-label="סינון לפי סטטוס" className="flex flex-wrap gap-1 mb-4">
        <Link href={href('')} className={`h-9 px-3 inline-flex items-center rounded-md text-sm ${!status ? 'bg-inkblue-soft text-inkblue font-medium' : 'text-ink-2 hover:bg-paper-3'}`}>
          הכל
        </Link>
        {TASK_STATUSES.map((s) => (
          <Link
            key={s}
            href={href(s)}
            className={`h-9 px-3 inline-flex items-center rounded-md text-sm ${status === s ? 'bg-inkblue-soft text-inkblue font-medium' : 'text-ink-2 hover:bg-paper-3'}`}
          >
            {statusMeta('Tasks', s).label}
          </Link>
        ))}
      </nav>

      <TaskList tasks={tasks} />
    </>
  );
}
