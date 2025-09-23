'use client';
import { cn } from "@/lib/utils";
import type { Status } from "./types";

const map: Record<Status, { label: string; cls: string }> = {
  idle: { label: 'Idle', cls: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  connecting: { label: 'Connecting', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  listening: { label: 'Listening', cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
  speaking: { label: 'Speaking', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  error: { label: 'Error', cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export default function StatusChip({ status }: { status: Status }) {
  const m = map[status];
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm', m.cls)}>
      <div className={cn('w-2 h-2 rounded-full', status === 'error' ? 'bg-red-400' : 'bg-current')} />
      {m.label}
    </div>
  );
}


