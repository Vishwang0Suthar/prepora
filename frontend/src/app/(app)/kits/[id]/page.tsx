"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  Layers3,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";

import { apiRequest } from "@/lib/api";
import { KitSidebar } from "@/components/layout/kit-sidebar";

type KitStatus = "generating" | "ready" | "failed";

type ProgressStep =
  | "generating_requirements"
  | "crawling"
  | "generating_company_brief"
  | "generating_questions"
  | "checking_coverage"
  | "generating_schedule"
  | "validating";

interface InterviewKit {
  source: {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_text: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
  };

  company_brief: {
    summary: string;
    what_they_do: string;
    sources: string[];
  };

  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: {
      id: string;
      text: string;
      kind: "technical" | "behavioural" | "domain";
      priority: "must" | "nice";
    }[];
  };

  questions: {
    id: string;
    requirement_ids: string[];
    category: "technical" | "behavioural" | "system-design" | "company-fit";
    prompt: string;
    answer_outline: string;
    difficulty: 1 | 2 | 3;
    origin: "generated" | "edited" | "manual";
    pinned: boolean;
  }[];

  flashcards: {
    id: string;
    front: string;
    back: string;
    requirement_ids: string[];
    origin: "generated" | "edited" | "manual";
    pinned: boolean;
  }[];

  schedule: {
    days_available: number;
    days: {
      day: number;
      focus: string;
      question_ids: string[];
      minutes: number;
    }[];
  };

  coverage: {
    uncovered_requirement_ids: string[];
    passes: number;
  };
}

interface KitResponse {
  ok: boolean;

  kit: {
    id: string;
    status: KitStatus;
    company: string;
    company_url: string;
    role: string;
    location: string | null;
    days_available: number;
    jd_text: string;
    kit: InterviewKit | null;

    error: {
      code?: string;
      message?: string;
    } | null;

    progress_step: ProgressStep | null;

    created_at: string;
    updated_at: string;
  };
}

const steps: {
  id: ProgressStep;
  label: string;
}[] = [
  {
    id: "generating_requirements",
    label: "Extracting requirements",
  },
  {
    id: "crawling",
    label: "Researching company",
  },
  {
    id: "generating_company_brief",
    label: "Building company brief",
  },
  {
    id: "generating_questions",
    label: "Generating interview questions",
  },
  {
    id: "checking_coverage",
    label: "Checking requirement coverage",
  },
  {
    id: "generating_schedule",
    label: "Building preparation schedule",
  },
  {
    id: "validating",
    label: "Validating interview kit",
  },
];

export default function KitPage() {
  const params = useParams();
  const router = useRouter();

  const kitId = params.id as string;

  const [kit, setKit] = useState<KitResponse["kit"] | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadKit = useCallback(async () => {
    try {
      const response = await apiRequest<KitResponse>(`/api/kits/${kitId}`);

      setKit(response.kit);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load interview kit.",
      );
    }
  }, [kitId]);

  useEffect(() => {
    loadKit();
  }, [loadKit]);

  useEffect(() => {
    if (!kit || kit.status !== "generating") {
      return;
    }

    const interval = window.setInterval(loadKit, 2500);

    return () => window.clearInterval(interval);
  }, [kit, loadKit]);

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/10 bg-red-400/[0.05]">
            <AlertCircle size={18} className="text-red-400" />
          </div>

          <h1 className="text-lg font-semibold text-white">
            Unable to load kit
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">{error}</p>

          <button
            onClick={loadKit}
            className="mt-5 rounded-md bg-white px-4 py-2 text-xs font-medium text-black"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 size={20} className="animate-spin text-zinc-600" />
      </div>
    );
  }

  if (kit.status === "failed") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/10 bg-red-400/[0.05]">
            <AlertCircle size={18} className="text-red-400" />
          </div>

          <p className="mb-2 text-xs text-zinc-600">{kit.company}</p>

          <h1 className="text-xl font-semibold text-white">
            Kit generation failed
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            {kit.error?.message ||
              "Something went wrong while generating this interview kit."}
          </p>

          {kit.error?.code && (
            <p className="mt-3 font-mono text-[11px] text-zinc-700">
              {kit.error.code}
            </p>
          )}

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-md bg-white px-4 py-2 text-xs font-medium text-black"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  /*
   * READY
   *
   * The backend has finished generating the InterviewKit.
   * Render the actual workspace overview.
   */
  if (kit.status === "ready" && kit.kit) {
    const interviewKit = kit.kit;

    const requirements = interviewKit.role.requirements;

    const questions = interviewKit.questions;

    const flashcards = interviewKit.flashcards;

    const schedule = interviewKit.schedule;

    const uncovered = interviewKit.coverage.uncovered_requirement_ids;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-600">
            <span>{kit.company}</span>

            <span>/</span>

            <span>{interviewKit.role.title}</span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white">
                {interviewKit.role.title}
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                {interviewKit.role.seniority}
                {" · "}
                {kit.location || "Location not specified"}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              {uncovered.length === 0 ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-400" />

                  <span className="text-xs text-zinc-400">
                    Full requirement coverage
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-amber-400" />

                  <span className="text-xs text-zinc-400">
                    {uncovered.length} requirements uncovered
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="lg:pt-2">
            <KitSidebar kitId={kitId} />
          </aside>

          <main className="min-w-0 space-y-6">
            {/* Company brief */}
            <section className="rounded-lg border border-white/[0.07] bg-[#0b0c0e] p-6">
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  Company brief
                </p>

                <h2 className="text-lg font-medium tracking-[-0.02em] text-zinc-200">
                  {interviewKit.company_brief.what_they_do}
                </h2>
              </div>

              <p className="max-w-3xl text-sm leading-7 text-zinc-500">
                {interviewKit.company_brief.summary}
              </p>
            </section>

            {/* Stats */}
            <section className="grid gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
              <StatCard
                icon={Target}
                label="Requirements"
                value={requirements.length}
              />

              <StatCard
                icon={MessageSquare}
                label="Questions"
                value={questions.length}
              />

              <StatCard
                icon={Layers3}
                label="Flashcards"
                value={flashcards.length}
              />
            </section>

            {/* Requirements */}
            <section className="rounded-lg border border-white/[0.07] bg-[#0b0c0e]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div>
                  <h2 className="text-sm font-medium text-zinc-200">
                    Requirements
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    What your preparation is built around.
                  </p>
                </div>

                <span className="text-xs text-zinc-700">
                  {requirements.length} total
                </span>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {requirements.map((requirement) => (
                  <div
                    key={requirement.id}
                    className="flex items-start justify-between gap-5 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />

                      <p className="text-sm leading-6 text-zinc-400">
                        {requirement.text}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded border border-white/[0.06] px-2 py-1 text-[10px] capitalize text-zinc-600">
                        {requirement.kind}
                      </span>

                      <span className="rounded border border-white/[0.06] px-2 py-1 text-[10px] text-zinc-600">
                        {requirement.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Preparation plan */}
            <section className="rounded-lg border border-white/[0.07] bg-[#0b0c0e]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div>
                  <h2 className="text-sm font-medium text-zinc-200">
                    Preparation plan
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    {schedule.days_available}{" "}
                    {schedule.days_available === 1 ? "day" : "days"} available
                  </p>
                </div>

                <CalendarDays size={15} className="text-zinc-700" />
              </div>

              <div className="divide-y divide-white/[0.05]">
                {schedule.days.map((day) => (
                  <Link
                    key={day.day}
                    href={`/kits/${kitId}/schedule`}
                    className="flex items-center justify-between gap-5 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                  >
                    <div>
                      <p className="text-xs font-medium text-zinc-300">
                        Day {day.day}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">{day.focus}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-zinc-600">
                        {day.minutes} min
                      </span>

                      <ArrowRight size={14} className="text-zinc-700" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  /*
   * GENERATING
   */
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === kit.progress_step),
  );

  return (
    <div className="flex min-h-[75vh] items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <Sparkles size={18} className="text-zinc-300" />
          </div>

          <p className="mb-2 text-xs text-zinc-600">{kit.company}</p>

          <h1 className="text-xl font-semibold tracking-[-0.025em] text-white">
            Building your interview kit
          </h1>

          <p className="mt-2 text-sm text-zinc-600">{kit.role}</p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#0b0c0e] p-5">
          <div className="space-y-1">
            {steps.map((step, index) => {
              const completed = index < activeIndex;

              const active = index === activeIndex;

              return (
                <div
                  key={step.id}
                  className={[
                    "flex items-center gap-3 rounded-md px-3 py-3",
                    active ? "bg-white/[0.04]" : "",
                  ].join(" ")}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {completed ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                        <Check size={12} />
                      </div>
                    ) : active ? (
                      <Loader2
                        size={16}
                        className="animate-spin text-zinc-300"
                      />
                    ) : (
                      <Circle size={15} className="text-zinc-800" />
                    )}
                  </div>

                  <span
                    className={[
                      "text-sm",
                      active || completed ? "text-zinc-300" : "text-zinc-700",
                    ].join(" ")}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <p className="text-center text-[11px] text-zinc-700">
              This can take a little while while we research the company and
              build your preparation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-[#0b0c0e] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-600">{label}</span>

        <Icon size={15} className="text-zinc-700" />
      </div>

      <p className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-zinc-200">
        {value}
      </p>
    </div>
  );
}
