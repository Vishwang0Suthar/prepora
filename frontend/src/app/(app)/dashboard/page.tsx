"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  FileText,
  Plus,
} from "lucide-react";

import { apiRequest } from "@/lib/api";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";

interface KitSummary {
  id: string;
  company: string;
  company_url: string;
  role: string;
  location: string | null;
  days_available: number;
  status: "generating" | "ready" | "failed";
  created_at: string;
  updated_at: string;
}

interface KitsResponse {
  ok: boolean;
  kits: KitSummary[];
}

export default function DashboardPage() {
  const [kits, setKits] = useState<KitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadKits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<KitsResponse>("/api/kits");
      setKits(response.kits ?? []);
    } catch (error) {
      console.error("Failed to load kits:", error);

      setError(
        error instanceof Error
          ? error.message
          : "We couldn't retrieve your interview kits.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  const readyCount = kits.filter((kit) => kit.status === "ready").length;

  const generatingCount = kits.filter(
    (kit) => kit.status === "generating",
  ).length;

  return (
    <main className="space-y-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-zinc-600">Workspace</p>

          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
            Interview Kits
          </h1>

          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Build structured preparation plans from your job descriptions.
          </p>
        </div>

        <Link
          href="/kits/new"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white px-3 text-xs font-medium text-black transition-opacity hover:opacity-90"
        >
          <Plus size={14} />
          New kit
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<FileText size={15} />}
          label="Total kits"
          value={kits.length}
        />

        <StatCard
          icon={<BriefcaseBusiness size={15} />}
          label="Ready"
          value={readyCount}
        />

        <StatCard
          icon={<Clock3 size={15} />}
          label="Generating"
          value={generatingCount}
        />
      </section>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-white/[0.07] bg-[#0b0c0e]">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load your kits"
          description={error}
          action={
            <button
              type="button"
              onClick={loadKits}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Try again
            </button>
          }
        />
      ) : kits.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="space-y-2">
          {kits.map((kit) => (
            <KitCard key={kit.id} kit={kit} />
          ))}
        </section>
      )}
    </main>
  );
}

function KitCard({ kit }: { kit: KitSummary }) {
  return (
    <Link
      href={`/kits/${kit.id}`}
      className="group block rounded-lg border border-white/[0.07] bg-[#0b0c0e] px-5 py-5 transition-colors hover:border-white/[0.12]"
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-300">
              {kit.company || "Untitled company"}
            </span>

            <StatusBadge status={kit.status} />
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            {kit.role || "Role not specified"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-zinc-700">
            {kit.location && <span>{kit.location}</span>}

            <span>{kit.days_available} days</span>

            <span>Created {new Date(kit.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <ArrowRight
          size={16}
          className="shrink-0 text-zinc-800 transition-all group-hover:translate-x-1 group-hover:text-zinc-400"
        />
      </div>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#0b0c0e] px-4 py-4">
      <div className="flex items-center gap-2 text-zinc-700">
        {icon}

        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <p className="mt-3 text-lg font-medium text-zinc-300">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-white/[0.08] bg-[#0b0c0e] py-24 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-white/[0.07] text-zinc-700">
        <BriefcaseBusiness size={17} />
      </div>

      <h2 className="mt-5 text-sm font-medium text-zinc-400">
        No interview kits yet
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-zinc-700">
        Create your first kit from a job description and let Prepora build your
        preparation plan.
      </p>

      <Link
        href="/kits/new"
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/[0.08] px-3 py-2 text-xs text-zinc-500 transition-colors hover:border-white/[0.14] hover:text-zinc-300"
      >
        <Plus size={13} />
        Create interview kit
      </Link>
    </section>
  );
}
