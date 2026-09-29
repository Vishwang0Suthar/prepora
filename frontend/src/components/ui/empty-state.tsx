import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/50 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
        <Icon className="h-5 w-5 text-zinc-400" />
      </div>

      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-300">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
