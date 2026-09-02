'use client';

import Link from 'next/link';
import { useActionState, useOptimistic, useRef, useTransition } from 'react';
import { toast } from 'sonner';
import type { Task } from '@/lib/types';
import { addTask, toggleTask, type AddTaskState } from './actions';
import { taskSourceMeta } from '@/lib/task-source';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/forms/submit-button';
import { FieldError } from '@/components/forms/field-error';

/** תג מקור: לאוטומציה יש קישור למסך היעד, למשימה ידנית רק תווית. המזהה לטיני ולכן LTR בנפרד מהתווית. */
function TaskSourceTag({ source, refId }: { source?: string; refId?: string }) {
  const m = taskSourceMeta(source);
  const cls = 'shrink-0 text-[12px] text-ink-3 whitespace-nowrap';
  const content = (
    <>
      {m.label}
      {refId && (
        <>
          {' · '}
          <span dir="ltr" className="num">{refId}</span>
        </>
      )}
    </>
  );
  if (!m.href) return <span className={cls}>{content}</span>;
  const label = [m.label, refId].filter(Boolean).join(' ');
  return (
    <Link href={m.href} className={`${cls} underline-offset-4 hover:underline hover:text-ink`} aria-label={`${label} — פתח`}>
      {content}
    </Link>
  );
}

function TaskRow({ task }: { task: Task }) {
  const [pending, start] = useTransition();
  // אופטימי: הסימון משתנה מיידית, השרת מאשר אחר כך (או מחזיר toast שגיאה והמצב חוזר).
  const [done, setDone] = useOptimistic(task.fields.Status === 'done');
  const id = `task-${task.id}`;
  return (
    <li className={`flex items-center gap-3 min-h-11 px-4 border-b border-rule last:border-0 ${pending ? 'opacity-60' : ''}`}>
      <input
        id={id}
        type="checkbox"
        className="size-4 accent-signal shrink-0"
        checked={done}
        aria-label={task.fields.Title}
        onChange={(e) => {
          const next = e.target.checked;
          start(async () => {
            setDone(next);
            const r = await toggleTask(task.id, next);
            if (r.error) toast.error(r.error);
          });
        }}
      />
      <label htmlFor={id} className={`flex-1 py-3 text-sm cursor-pointer ${done ? 'text-ink-3 line-through' : 'text-ink'}`}>
        {task.fields.Title}
      </label>
      <TaskSourceTag source={task.fields.Source} refId={task.fields.RefId} />
    </li>
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<AddTaskState, FormData>(async (prev, fd) => {
    const r = await addTask(prev, fd);
    if (r?.ok) formRef.current?.reset();
    return r;
  }, undefined);

  const open = tasks.filter((t) => t.fields.Status !== 'done');
  const done = tasks.filter((t) => t.fields.Status === 'done');

  return (
    <>
      <form ref={formRef} action={action} className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input name="Title" placeholder="משימה חדשה" aria-label="משימה חדשה" autoComplete="off" />
          <FieldError msg={state?.error} />
        </div>
        <SubmitButton pendingText="מוסיף…">הוסף</SubmitButton>
      </form>

      <div className="panel overflow-hidden">
        {tasks.length === 0 ? (
          <p className="text-center py-16 text-ink-2">אין משימות. הוסף את הראשונה למעלה.</p>
        ) : (
          <>
            <ul aria-label="משימות פתוחות">
              {open.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
            {done.length > 0 && (
              <>
                <div className="px-4 py-2 text-[12px] font-medium tracking-wide text-ink-3 bg-paper-3 border-y border-rule">
                  בוצעו · {done.length}
                </div>
                <ul aria-label="משימות שבוצעו">
                  {done.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
