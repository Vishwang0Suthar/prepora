"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Check, Clock3, Target, CircleAlert } from "lucide-react";

import { KitSidebar } from "@/components/layout/kit-sidebar";
import { apiRequest } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Question {
  id: string;
  prompt: string;
  category: "technical" | "behavioural" | "system-design" | "company-fit";
  difficulty: 1 | 2 | 3;
}

interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

interface KitResponse {
  ok: boolean;
  kit: {
    status: "generating" | "ready" | "failed";
    kit: {
      questions: Question[];
      schedule: {
        days_available: number;
        days: ScheduleDay[];
      } | null;
    } | null;
  };
}

interface PracticeProgress {
  id: string;
  item_type: "question" | "flashcard";
  item_id: string;
  status: "not_started" | "in_progress" | "completed";
  confidence_rating: number | null;
  last_reviewed_at: string | null;
  updated_at: string;
}

interface ProgressResponse {
  ok: boolean;
  progress: PracticeProgress[];
}

export default function SchedulePage() {
  const params = useParams();
  const kitId = params.id as string;

  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<PracticeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysAvailable, setDaysAvailable] = useState(0);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [kitResponse, progressResponse] = await Promise.all([
        apiRequest<KitResponse>(`/api/kits/${kitId}`),
        apiRequest<ProgressResponse>(`/api/kits/${kitId}/progress`),
      ]);

      const generatedSchedule = kitResponse.kit.kit?.schedule;

      setSchedule(generatedSchedule?.days ?? []);
      setDaysAvailable(generatedSchedule?.days_available ?? 0);
      setQuestions(kitResponse.kit.kit?.questions ?? []);
      setProgress(progressResponse.progress ?? []);
    } catch (error) {
      console.error("Failed to load schedule:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load your preparation schedule.",
      );
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const questionMap = useMemo(() => {
    return new Map(questions.map((question) => [question.id, question]));
  }, [questions]);

  const completedQuestionIds = useMemo(() => {
    return new Set(
      progress
        .filter(
          (item) =>
            item.item_type === "question" && item.status === "completed",
        )
        .map((item) => item.item_id),
    );
  }, [progress]);

  const totalQuestions = questions.length;

  const completedQuestions = useMemo(() => {
    return questions.filter((question) => completedQuestionIds.has(question.id))
      .length;
  }, [questions, completedQuestionIds]);

  const overallProgress =
    totalQuestions > 0
      ? Math.round((completedQuestions / totalQuestions) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-xl">
          <ErrorState
            title="Unable to load schedule"
            description={error}
            action={
              <button
                type="button"
                onClick={loadSchedule}
                className="rounded-md bg-white px-4 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-200"
              >
                Try again
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <KitSidebar kitId={kitId} />

      <main className="min-w-0 space-y-8">
        <header>
          <p className="text-xs text-zinc-600">Preparation plan</p>

          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
            Schedule
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-zinc-300">
            Follow the generated plan and use your practice progress to see how
            much preparation is complete.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<CalendarDays size={15} />}
            label="Days"
            value={daysAvailable}
          />

          <SummaryCard
            icon={<Target size={15} />}
            label="Questions"
            value={`${completedQuestions}/${totalQuestions}`}
          />

          <SummaryCard
            icon={<Check size={15} />}
            label="Complete"
            value={`${overallProgress}%`}
          />
        </section>

        {schedule.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No preparation schedule yet"
            description="A preparation schedule will appear here once your interview kit has finished generating."
          />
        ) : (
          <div className="space-y-3">
            {schedule.map((day) => {
              const dayQuestions = day.question_ids
                .map((id) => questionMap.get(id))
                .filter((question): question is Question => Boolean(question));

              const missingQuestionIds = day.question_ids.filter(
                (id) => !questionMap.has(id),
              );

              const completedForDay = dayQuestions.filter((question) =>
                completedQuestionIds.has(question.id),
              ).length;

              const dayProgress =
                dayQuestions.length > 0
                  ? Math.round((completedForDay / dayQuestions.length) * 100)
                  : 0;

              return (
                <section
                  key={day.day}
                  className="rounded-lg border border-white/20 bg-[#000000]"
                >
                  <div className="border-b border-white/20 px-5 py-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/[0.02] text-xs font-medium text-zinc-300">
                          {day.day}
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Day {day.day}
                          </p>

                          <h2 className="mt-1 text-sm font-medium text-zinc-300">
                            {day.focus || "Interview preparation"}
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-600">
                        <span className="flex items-center gap-1.5">
                          <Clock3 size={13} />
                          {day.minutes} min
                        </span>

                        <span>
                          {completedForDay}/{dayQuestions.length}
                        </span>

                        <span>{dayProgress}%</span>
                      </div>
                    </div>

                    <div className="mt-5 h-1 overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-zinc-500 transition-all"
                        style={{
                          width: `${dayProgress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.05]">
                    {dayQuestions.map((question) => {
                      const completed = completedQuestionIds.has(question.id);

                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => {
                            window.location.href = `/kits/${kitId}/practice?question=${question.id}`;
                          }}
                          className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                        >
                          <div
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              completed
                                ? "border-white/[0.15] bg-white/[0.08] text-zinc-300"
                                : "border-white/20 text-transparent",
                            ].join(" ")}
                          >
                            {completed && <Check size={11} />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className={[
                                "text-sm leading-6",
                                completed ? "text-zinc-600" : "text-zinc-400",
                              ].join(" ")}
                            >
                              {question.prompt}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="text-xs capitalize text-zinc-500">
                                {question.category}
                              </span>

                              <span className="text-xs text-zinc-800">•</span>

                              <span className="text-xs text-zinc-500">
                                Difficulty {question.difficulty}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {missingQuestionIds.map((questionId) => (
                      <div
                        key={`missing-${questionId}`}
                        className="flex items-start gap-4 px-5 py-4"
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500/10 bg-amber-500/[0.03] text-amber-500/60">
                          <CircleAlert size={11} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-zinc-600">
                            Question unavailable
                          </p>

                          <p className="mt-1 text-xs text-zinc-800">
                            This scheduled question is no longer present in the
                            interview kit.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {day.question_ids.length === 0 && (
                    <div className="rounded-md border border-dashed border-white/20 py-10 text-center">
                      <Target size={18} className="mx-auto text-zinc-500" />

                      <p className="mt-3 text-xs text-zinc-600">
                        No questions assigned to this day.
                      </p>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-white/20 bg-[#000000] px-4 py-4">
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}

        <span className="text-xs font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <p className="mt-3 text-lg font-medium text-zinc-300">{value}</p>
    </div>
  );
}
