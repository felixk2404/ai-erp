import { list } from '@/lib/airtable';
import type { TaskFields } from '@/lib/types';
import { Header } from '@/components/shell/header';
import { TaskList } from './task-list';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const tasks = await list<TaskFields>('Tasks');
  return (
    <>
      <Header title="משימות" />
      <TaskList tasks={tasks} />
    </>
  );
}
