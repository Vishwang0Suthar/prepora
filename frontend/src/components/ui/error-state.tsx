import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description: string;
  action?: React.ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/[0.03] px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/10">
        <AlertCircle className="h-5 w-5 text-red-400" />
      </div>

      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-300">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
