import { ils } from '@/lib/format';

export function Money({ value, className = '' }: { value: number; className?: string }) {
  return <span className={`num ${className}`}>{ils(value)}</span>;
}
