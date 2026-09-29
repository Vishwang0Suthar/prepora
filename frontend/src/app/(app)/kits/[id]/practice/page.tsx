"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

import { KitSidebar } from "@/components/layout/kit-sidebar";
import { apiRequest } from "@/lib/api";

interface Question {
  id: string;
  requirement_ids: string[];
  category: "technical" | "behavioural" | "system-design" | "company-fit";
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
  origin: "generated" | "edited" | "manual";
  pinned: boolean;
}

interface KitResponse {
  ok: boolean;
  kit: {
    status: "generating" | "ready" | "failed";
    kit: {
      questions: Question[];
    } | null;
  };
}

type Confidence = "low" | "medium" | "high";

type PracticeStatus = "not_started" | "in_progress" | "completed";

interface PracticeProgress {
  id: string;
  kit_id: string;
  item_type: "question" | "flashcard";
  item_id: string;
  status: PracticeStatus;
  confidence_rating: number | null;
  last_reviewed_at: string | null;
  updated_at: string;
}

interface ProgressResponse {
  ok: boolean;
  progress: PracticeProgress[];
}

interface UpdateProgressInput {
  item_type: "question";
  item_id: string;
  status: PracticeStatus;
  confidence_rating: number;
}

const confidenceMap: Record<Confidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const confidenceOptions: {
  value: Confidence;
  label: string;
  rating: number;
}[] = [
  {
    value: "low",
    label: "Need work",
    rating: 1,
  },
  {
    value: "medium",
    label: "Getting there",
    rating: 2,
  },
  {
    value: "high",
    label: "Confident",
    rating: 3,
  },
];

export default function PracticePage() {
  const params = useParams();
  const kitId = params.id as string;
  const searchParams = useSearchParams();

  const requestedQuestionId = searchParams.get("question");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [practiceState, setPracticeState] = useState<
    Record<string, Confidence>
  >({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPractice = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [kitResponse, progressResponse] = await Promise.all([
        apiRequest<KitResponse>(`/api/kits/${kitId}`),
        apiRequest<ProgressResponse>(`/api/kits/${kitId}/progress`),
      ]);

      const loadedQuestions = kitResponse.kit.kit?.questions ?? [];

      const progressMap: Record<string, Confidence> = {};

      for (const item of progressResponse.progress) {
        if (item.item_type !== "question" || item.confidence_rating === null) {
          continue;
        }

        if (item.confidence_rating === 1) {
          progressMap[item.item_id] = "low";
        } else if (item.confidence_rating === 2) {
          progressMap[item.item_id] = "medium";
        } else if (item.confidence_rating === 3) {
          progressMap[item.item_id] = "high";
        }
      }

      setQuestions(loadedQuestions);
      setPracticeState(progressMap);

      const requestedIndex = requestedQuestionId
        ? loadedQuestions.findIndex(
            (question) => question.id === requestedQuestionId,
          )
        : -1;

      setCurrentIndex(requestedIndex >= 0 ? requestedIndex : 0);
      setShowAnswer(false);
    } catch (err) {
      console.error("Failed to load practice:", err);

      setError(err instanceof Error ? err.message : "Unable to load practice.");
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    loadPractice();
  }, [loadPractice]);

  const currentQuestion = questions[currentIndex];

  const practicedCount = useMemo(
    () => Object.keys(practiceState).length,
    [practiceState],
  );

  const progress =
    questions.length > 0
      ? Math.round((practicedCount / questions.length) * 100)
      : 0;

  const setConfidence = async (confidence: Confidence) => {
    if (!currentQuestion || saving) {
      return;
    }

    const previousValue = practiceState[currentQuestion.id];

    setPracticeState((previous) => ({
      ...previous,
      [currentQuestion.id]: confidence,
    }));

    setSaving(true);

    try {
      const payload: UpdateProgressInput = {
        item_type: "question",
        item_id: currentQuestion.id,
        status: "completed",
        confidence_rating: confidenceMap[confidence],
      };

      await apiRequest(`/api/kits/${kitId}/progress`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to save practice progress:", error);

      setPracticeState((previous) => {
        const next = { ...previous };

        if (previousValue) {
          next[currentQuestion.id] = previousValue;
        } else {
          delete next[currentQuestion.id];
        }

        return next;
      });
    } finally {
      setSaving(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      return;
    }

    setCurrentIndex((previous) => previous + 1);
    setShowAnswer(false);
  };

  const previousQuestion = () => {
    if (currentIndex <= 0) {
      return;
    }

    setCurrentIndex((previous) => previous - 1);
    setShowAnswer(false);
  };

  const resetPractice = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-xl">
          <ErrorState
            title="Unable to load practice"
            description={error}
            action={
              <button
                type="button"
                onClick={loadPractice}
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
  if (questions.length === 0) {
    return (
      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <KitSidebar kitId={kitId} />

        <main className="min-w-0">
          <div className="rounded-lg border border-dashed border-white/20 py-20 text-center">
            <p className="text-sm text-zinc-300">
              No practice questions are available yet.
            </p>

            <p className="mt-2 text-xs text-zinc-400">
              Questions will appear here once they are generated for this kit.
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
        <div>
          <p className="text-xs text-zinc-400">Interview practice</p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white">
                Practice
              </h1>

              <p className="mt-2 text-sm text-zinc-300">
                Practice one question at a time. Rate your confidence to track
                your preparation.
              </p>
            </div>

            <button
              type="button"
              onClick={resetPractice}
              className="flex w-fit cursor-pointer items-center gap-2 text-xs text-zinc-400 transition-colors hover:text-zinc-300"
            >
              <RotateCcw size={13} />
              Start from beginning
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/20 bg-[#000000]">
          <div className="border-b border-white/20 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-400">
                Question{" "}
                <span className="text-zinc-300">{currentIndex + 1}</span> of{" "}
                <span className="text-zinc-300">{questions.length}</span>
              </div>

              <div className="text-xs text-zinc-400">
                <span className="text-zinc-300">{practicedCount}</span>/
                {questions.length} practiced
              </div>
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full bg-zinc-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="px-5 py-8 sm:px-8 sm:py-10">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="rounded border border-white/20 px-2 py-1 text-xs capitalize text-zinc-400">
                {currentQuestion.category}
              </span>

              <Difficulty value={currentQuestion.difficulty} />

              {currentQuestion.pinned && (
                <span className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-400">
                  Pinned
                </span>
              )}

              {practiceState[currentQuestion.id] && (
                <span className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-400">
                  {practiceState[currentQuestion.id] === "high"
                    ? "Confident"
                    : practiceState[currentQuestion.id] === "medium"
                      ? "Getting there"
                      : "Needs work"}
                </span>
              )}
            </div>

            <h2 className="max-w-3xl text-xl font-medium leading-8 tracking-[-0.02em] text-zinc-200 sm:text-2xl">
              {currentQuestion.prompt}
            </h2>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => setShowAnswer((previous) => !previous)}
                className="flex items-center gap-2 text-xs text-zinc-300 transition-colors hover:text-zinc-300"
              >
                <ChevronDown
                  size={14}
                  className={[
                    "transition-transform",
                    showAnswer ? "rotate-180" : "",
                  ].join(" ")}
                />

                {showAnswer ? "Hide answer outline" : "Reveal answer outline"}
              </button>

              {showAnswer && (
                <div className="mt-4 rounded-md border border-white/20 bg-white/[0.02] p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Answer outline
                  </p>

                  <p className="max-w-3xl text-sm leading-7 text-zinc-300">
                    {currentQuestion.answer_outline}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/20 px-5 py-5 sm:px-8">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                How confident are you?
              </p>

              {saving && (
                <span className="text-xs text-zinc-400">Saving...</span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {confidenceOptions.map((option) => {
                const selected =
                  practiceState[currentQuestion.id] === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={saving}
                    onClick={() => setConfidence(option.value)}
                    className={[
                      "flex items-center gap-2 rounded-md border cursor-pointer  px-3 py-2 text-xs transition-colors",
                      selected
                        ? "border-white/[0.14] bg-white/[0.08] text-zinc-200"
                        : "border-white/20 text-zinc-400 bg-black hover:invert",
                      "disabled:pointer-events-none disabled:opacity-50",
                    ].join(" ")}
                  >
                    {selected && <Check size={12} />}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/20 px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={previousQuestion}
              disabled={currentIndex === 0}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-zinc-300 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowLeft size={14} />
              Previous
            </button>

            <button
              type="button"
              onClick={nextQuestion}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center cursor-pointer gap-2 rounded-md bg-white/[0.08] px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/[0.12] disabled:pointer-events-none disabled:opacity-30"
            >
              Next
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Questions" value={questions.length} />

          <Stat label="Practiced" value={practicedCount} />

          <Stat label="Progress" value={`${progress}%`} />
        </div>
      </main>
    </div>
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/20 bg-[#000000] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-medium text-zinc-300">{value}</p>
    </div>
  );
}
