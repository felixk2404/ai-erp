'use server';

import { revalidatePath } from 'next/cache';
import { erpCreate, erpUpdate, ErpError } from '@/lib/n8n';
import { logError } from '@/lib/log';
import type { TaskFields } from '@/lib/types';
import type { ActionResult } from '@/components/forms/action-button';

const msg = (e: unknown, fallback: string) => (e instanceof ErpError ? e.message : fallback);

export type AddTaskState = { error?: string; ok?: boolean } | undefined;

export async function addTask(_prev: AddTaskState, fd: FormData): Promise<AddTaskState> {
  const Title = String(fd.get('Title') ?? '').trim();
  if (!Title) return { error: 'יש להזין כותרת למשימה' };
  try {
    await erpCreate<TaskFields>('Tasks', { Title, Status: 'open', Source: 'manual' });
  } catch (e) {
    logError('tasks.add', e);
    return { error: msg(e, 'הוספת המשימה נכשלה') };
  }
  revalidatePath('/tasks');
  revalidatePath('/');
  return { ok: true };
}

export async function toggleTask(id: string, done: boolean): Promise<ActionResult> {
  try {
    await erpUpdate<TaskFields>('Tasks', id, { Status: done ? 'done' : 'open' });
  } catch (e) {
    logError('tasks.toggle', e);
    return { error: msg(e, 'עדכון המשימה נכשל') };
  }
  revalidatePath('/tasks');
  revalidatePath('/');
  return { ok: true };
}
