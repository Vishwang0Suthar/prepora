"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
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

  const failedCount = kits.filter((kit) => kit.status === "failed").length;

  return (
    <main className="space-y-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Workspace
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
            Interview Kits
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">
            Build structured preparation plans from your job descriptions.
          </p>
        </div>

        <Link
          href="/kits/new"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white px-3.5 text-xs font-medium text-black transition-opacity hover:opacity-90"
        >
          <Plus size={14} />
          New kit
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

        <StatCard
          icon={<AlertCircle size={15} />}
          label="Failed"
          value={failedCount}
        />
      </section>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-white/20 bg-[#000000]">
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
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
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
      className="group block rounded-lg border border-white/20 bg-[#000000] px-5 py-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.012]"
    >
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-200">
              {kit.company || "Untitled company"}
            </span>

            <StatusBadge status={kit.status} />
          </div>

          <p className="mt-1.5 truncate text-sm text-zinc-300">
            {kit.role || "Role not specified"}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
            {kit.location && <span>{kit.location}</span>}

            <span>{kit.days_available} days</span>

            <span>Created {new Date(kit.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent transition-colors group-hover:border-white/20 group-hover:bg-white/[0.03]">
          <ArrowRight
            size={15}
            className="text-zinc-400 transition-all group-hover:scale-105 group-hover:text-zinc-300"
          />
        </div>
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
    <div className="rounded-lg border border-white/20 bg-[#000000] px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          {icon}

          <span className="text-xs font-semibold uppercase tracking-[0.12em]">
            {label}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xl font-semibold tracking-[-0.025em] text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-white/20 bg-[#000000] py-24 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-zinc-400">
        <BriefcaseBusiness size={17} />
      </div>

      <h2 className="mt-5 text-sm font-medium text-zinc-300">
        No interview kits yet
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-zinc-400">
        Create your first kit from a job description and let Prepora build your
        preparation plan.
      </p>

      <Link
        href="/kits/new"
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-white/[0.14] hover:text-zinc-300"
      >
        <Plus size={13} />
        Create interview kit
      </Link>
    </section>
  );
}
