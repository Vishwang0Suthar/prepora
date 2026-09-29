"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Target } from "lucide-react";

import { KitSidebar } from "@/components/layout/kit-sidebar";
import { apiRequest } from "@/lib/api";

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

interface KitData {
  questions: Question[];
  schedule: {
    days_available: number;
    days: ScheduleDay[];
  } | null;
}

interface KitResponse {
  ok: boolean;
  kit: {
    status: "generating" | "ready" | "failed";
    kit: KitData | null;
  };
}

export default function SchedulePage() {
  const params = useParams();
  const kitId = params.id as string;

  const [kit, setKit] = useState<KitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  const loadSchedule = useCallback(async () => {
    try {
      const response = await apiRequest<KitResponse>(`/api/kits/${kitId}`);

      setKit(response.kit.kit);
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const schedule = kit?.schedule ?? null;

  const selectedScheduleDay = useMemo(
    () =>
      schedule?.days.find((scheduleDay) => scheduleDay.day === selectedDay) ??
      schedule?.days[0] ??
      null,
    [schedule, selectedDay],
  );

  const questionMap = useMemo(() => {
    const map = new Map<string, Question>();

    kit?.questions.forEach((question) => {
      map.set(question.id, question);
    });

    return map;
  }, [kit?.questions]);

  const totalMinutes = useMemo(
    () => schedule?.days.reduce((total, day) => total + day.minutes, 0) ?? 0,
    [schedule],
  );

  const completedDays = 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
      </div>
    );
  }

  if (!schedule || schedule.days.length === 0) {
    return (
      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <KitSidebar kitId={kitId} />

        <main className="min-w-0">
          <div className="rounded-lg border border-dashed border-white/[0.08] py-20 text-center">
            <CalendarDays size={20} className="mx-auto text-zinc-700" />

            <p className="mt-4 text-sm text-zinc-500">
              No preparation schedule is available yet.
            </p>

            <p className="mt-2 text-xs text-zinc-700">
              A schedule will appear here once your interview kit has finished
              generating.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <KitSidebar kitId={kitId} />

      <main className="min-w-0 space-y-6">
        <header>
          <p className="text-xs text-zinc-600">Preparation timeline</p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white">
                Schedule
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                A structured preparation plan based on your role requirements.
              </p>
            </div>

            <div className="text-xs text-zinc-600">
              {schedule.days_available}{" "}
              {schedule.days_available === 1 ? "day" : "days"} available
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat
            icon={<CalendarDays size={15} />}
            label="Days"
            value={schedule.days_available}
          />

          <Stat
            icon={<Clock3 size={15} />}
            label="Total time"
            value={formatMinutes(totalMinutes)}
          />

          <Stat
            icon={<CheckCircle2 size={15} />}
            label="Completed"
            value={`${completedDays}/${schedule.days.length}`}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-1">
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
              Preparation days
            </p>

            {schedule.days.map((day) => {
              const selected = day.day === selectedScheduleDay?.day;

              return (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => setSelectedDay(day.day)}
                  className={[
                    "w-full rounded-md border px-3 py-3 text-left transition-colors",
                    selected
                      ? "border-white/[0.1] bg-white/[0.05]"
                      : "border-transparent hover:bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={[
                        "text-xs font-medium",
                        selected ? "text-zinc-200" : "text-zinc-500",
                      ].join(" ")}
                    >
                      Day {day.day}
                    </span>

                    <span className="text-[10px] text-zinc-700">
                      {formatMinutes(day.minutes)}
                    </span>
                  </div>

                  <p
                    className={[
                      "mt-1 line-clamp-2 text-[11px] leading-5",
                      selected ? "text-zinc-500" : "text-zinc-700",
                    ].join(" ")}
                  >
                    {day.focus}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedScheduleDay && (
            <div className="rounded-lg border border-white/[0.07] bg-[#0b0c0e]">
              <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                      Day {selectedScheduleDay.day}
                    </p>

                    <h2 className="mt-2 text-lg font-medium tracking-[-0.02em] text-zinc-200">
                      Today&apos;s focus
                    </h2>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-zinc-600">
                    <Clock3 size={12} />
                    {formatMinutes(selectedScheduleDay.minutes)}
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
                  {selectedScheduleDay.focus}
                </p>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                    Questions for this day
                  </p>

                  <span className="text-[10px] text-zinc-700">
                    {selectedScheduleDay.question_ids.length}{" "}
                    {selectedScheduleDay.question_ids.length === 1
                      ? "question"
                      : "questions"}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedScheduleDay.question_ids.map((questionId, index) => {
                    const question = questionMap.get(questionId);

                    if (!question) {
                      return (
                        <div
                          key={questionId}
                          className="rounded-md border border-white/[0.05] px-4 py-4"
                        >
                          <div className="flex gap-3">
                            <span className="font-mono text-[10px] text-zinc-700">
                              {String(index + 1).padStart(2, "0")}
                            </span>

                            <p className="text-xs text-zinc-700">
                              Question unavailable
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={question.id}
                        className="rounded-md border border-white/[0.05] px-4 py-4 transition-colors hover:border-white/[0.08]"
                      >
                        <div className="flex gap-3">
                          <span className="font-mono text-[10px] text-zinc-700">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Badge>{question.category}</Badge>

                              <Difficulty value={question.difficulty} />
                            </div>

                            <p className="text-sm leading-6 text-zinc-400">
                              {question.prompt}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedScheduleDay.question_ids.length === 0 && (
                  <div className="rounded-md border border-dashed border-white/[0.06] py-10 text-center">
                    <Target size={18} className="mx-auto text-zinc-700" />

                    <p className="mt-3 text-xs text-zinc-600">
                      No questions assigned to this day.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#0b0c0e] px-4 py-4">
      <div className="flex items-center gap-2 text-zinc-700">
        {icon}

        <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </p>
      </div>

      <p className="mt-3 text-lg font-medium text-zinc-300">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-white/[0.06] px-2 py-1 text-[10px] capitalize text-zinc-600">
      {children}
    </span>
  );
}

function Difficulty({ value }: { value: 1 | 2 | 3 }) {
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3].map((level) => (
        <span
          key={level}
          className={[
            "h-1.5 w-1.5 rounded-full",
            level <= value ? "bg-zinc-400" : "bg-zinc-800",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
("use client");

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Check, Clock3, Target } from "lucide-react";

import { KitSidebar } from "@/components/layout/kit-sidebar";
import { apiRequest } from "@/lib/api";

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
    days_available: number;
    kit: {
      questions: Question[];
      schedule: {
        days_available: number;
        days: ScheduleDay[];
      };
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

  const loadSchedule = useCallback(async () => {
    try {
      const [kitResponse, progressResponse] = await Promise.all([
        apiRequest<KitResponse>(`/api/kits/${kitId}`),
        apiRequest<ProgressResponse>(`/api/kits/${kitId}/progress`),
      ]);

      setSchedule(kitResponse.kit.kit?.schedule.days ?? []);

      setQuestions(kitResponse.kit.kit?.questions ?? []);

      setProgress(progressResponse.progress);
    } catch (error) {
      console.error("Failed to load schedule:", error);
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

  const completedQuestions = completedQuestionIds.size;

  const overallProgress =
    totalQuestions > 0
      ? Math.round((completedQuestions / totalQuestions) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
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

          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Follow the generated plan and use your practice progress to see how
            much preparation is complete.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<CalendarDays size={15} />}
            label="Days"
            value={schedule.length}
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
          <div className="rounded-lg border border-dashed border-white/[0.08] py-20 text-center">
            <p className="text-sm text-zinc-500">
              No preparation schedule is available yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((day) => {
              const dayQuestions = day.question_ids
                .map((id) => questionMap.get(id))
                .filter((question): question is Question => Boolean(question));

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
                  className="rounded-lg border border-white/[0.07] bg-[#0b0c0e]"
                >
                  <div className="border-b border-white/[0.06] px-5 py-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] text-xs font-medium text-zinc-500">
                          {day.day}
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
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
                            window.location.href = `/kits/${kitId}/practice`;
                          }}
                          className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                        >
                          <div
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              completed
                                ? "border-white/[0.15] bg-white/[0.08] text-zinc-300"
                                : "border-white/[0.08] text-transparent",
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
                              <span className="text-[10px] capitalize text-zinc-700">
                                {question.category}
                              </span>

                              <span className="text-[10px] text-zinc-800">
                                •
                              </span>

                              <span className="text-[10px] text-zinc-700">
                                Difficulty {question.difficulty}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
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
