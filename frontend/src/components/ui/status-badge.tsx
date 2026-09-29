interface StatusBadgeProps {
  status: "generating" | "ready" | "failed";
}

const styles = {
  generating: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  ready: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  failed: "border-red-500/20 bg-red-500/10 text-red-400",
};

const labels = {
  generating: "Generating",
  ready: "Ready",
  failed: "Failed",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
