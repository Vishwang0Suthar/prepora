"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Pin,
  RotateCcw,
  Search,
} from "lucide-react";

import { KitSidebar } from "@/components/layout/kit-sidebar";
import { apiRequest } from "@/lib/api";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  origin: "generated" | "edited" | "manual";
  pinned: boolean;
}

interface KitResponse {
  ok: boolean;
  kit: {
    status: "generating" | "ready" | "failed";
    kit: {
      flashcards: Flashcard[];
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

type Confidence = 1 | 2 | 3;

const confidenceLabels: Record<Confidence, string> = {
  1: "Need to review",
  2: "Getting there",
  3: "Confident",
};

export default function FlashcardsPage() {
  const params = useParams();
  const kitId = params.id as string;

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [progress, setProgress] = useState<PracticeProgress[]>([]);

  const [search, setSearch] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [confidenceMap, setConfidenceMap] = useState<
    Record<string, Confidence>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadFlashcards = useCallback(async () => {
    try {
      const [kitResponse, progressResponse] = await Promise.all([
        apiRequest<KitResponse>(`/api/kits/${kitId}`),
        apiRequest<ProgressResponse>(`/api/kits/${kitId}/progress`),
      ]);

      const cards = kitResponse.kit.kit?.flashcards ?? [];

      setFlashcards(cards);
      setProgress(progressResponse.progress);

      const restored: Record<string, Confidence> = {};

      progressResponse.progress
        .filter(
          (item) =>
            item.item_type === "flashcard" && item.confidence_rating !== null,
        )
        .forEach((item) => {
          if (
            item.confidence_rating === 1 ||
            item.confidence_rating === 2 ||
            item.confidence_rating === 3
          ) {
            restored[item.item_id] = item.confidence_rating;
          }
        });

      setConfidenceMap(restored);
    } catch (error) {
      console.error("Failed to load flashcards:", error);
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  const filteredFlashcards = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matchingCards = !query
      ? flashcards
      : flashcards.filter(
          (flashcard) =>
            flashcard.front.toLowerCase().includes(query) ||
            flashcard.back.toLowerCase().includes(query),
        );

    return [...matchingCards].sort((a, b) => {
      const aConfidence = confidenceMap[a.id] ?? 0;
      const bConfidence = confidenceMap[b.id] ?? 0;

      return aConfidence - bConfidence;
    });
  }, [flashcards, search, confidenceMap]);

  const currentCard = filteredFlashcards[currentIndex] ?? null;

  useEffect(() => {
    if (currentIndex >= filteredFlashcards.length) {
      setCurrentIndex(Math.max(0, filteredFlashcards.length - 1));
    }
  }, [currentIndex, filteredFlashcards.length]);

  useEffect(() => {
    setRevealed(false);
  }, [currentCard?.id]);

  const studiedCount = useMemo(() => {
    return flashcards.filter(
      (flashcard) => confidenceMap[flashcard.id] !== undefined,
    ).length;
  }, [flashcards, confidenceMap]);

  const studiedPercentage =
    flashcards.length > 0
      ? Math.round((studiedCount / flashcards.length) * 100)
      : 0;

  const saveConfidence = async (confidence: Confidence) => {
    if (!currentCard || saving) return;

    setConfidenceMap((previous) => ({
      ...previous,
      [currentCard.id]: confidence,
    }));

    setSaving(true);

    try {
      await apiRequest(`/api/kits/${kitId}/progress`, {
        method: "PUT",
        body: JSON.stringify({
          item_type: "flashcard",
          item_id: currentCard.id,
          status: "completed",
          confidence_rating: confidence,
        }),
      });

      setProgress((previous) => {
        const existingIndex = previous.findIndex(
          (item) =>
            item.item_type === "flashcard" && item.item_id === currentCard.id,
        );

        const updatedItem: PracticeProgress = {
          id:
            existingIndex >= 0
              ? previous[existingIndex].id
              : `local-${currentCard.id}`,
          item_type: "flashcard",
          item_id: currentCard.id,
          status: "completed",
          confidence_rating: confidence,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (existingIndex === -1) {
          return [...previous, updatedItem];
        }

        return previous.map((item, index) =>
          index === existingIndex ? updatedItem : item,
        );
      });
    } catch (error) {
      console.error("Failed to save flashcard progress:", error);
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (currentIndex >= filteredFlashcards.length - 1) return;

    setCurrentIndex((index) => index + 1);
    setRevealed(false);
  };

  const goPrevious = () => {
    if (currentIndex <= 0) return;

    setCurrentIndex((index) => index - 1);
    setRevealed(false);
  };

  const resetReview = () => {
    setCurrentIndex(0);
    setRevealed(false);
  };

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

      <main className="min-w-0 space-y-7">
        <header>
          <p className="text-xs text-zinc-600">Interview preparation</p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white">
                Flashcards
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Review concepts from your role requirements and rate your
                confidence.
              </p>
            </div>

            <div className="text-xs text-zinc-600">
              <span className="text-zinc-300">{studiedCount}</span> of{" "}
              <span className="text-zinc-300">{flashcards.length}</span> studied
            </div>
          </div>
        </header>

        {flashcards.length > 0 && (
          <section className="rounded-lg border border-white/[0.07] bg-[#0b0c0e] px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                Review progress
              </span>

              <span className="text-xs text-zinc-600">
                {studiedPercentage}%
              </span>
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full bg-zinc-500 transition-all"
                style={{ width: `${studiedPercentage}%` }}
              />
            </div>
          </section>
        )}

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700"
          />

          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentIndex(0);
              setRevealed(false);
            }}
            placeholder="Search flashcards..."
            className="h-10 w-full rounded-md border border-white/[0.08] bg-[#0b0c0e] pl-9 pr-3 text-sm text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-white/[0.16]"
          />
        </div>

        {currentCard ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[11px] text-zinc-700">
                {String(currentIndex + 1).padStart(2, "0")} /{" "}
                {String(filteredFlashcards.length).padStart(2, "0")}
              </span>

              {currentCard.pinned && (
                <Pin size={13} className="fill-zinc-500 text-zinc-500" />
              )}
            </div>

            <article className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#0b0c0e]">
              <div className="px-6 py-10 sm:px-10 sm:py-14">
                <div className="flex items-center gap-2">
                  <span className="rounded border border-white/[0.06] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-zinc-600">
                    Flashcard
                  </span>

                  {currentCard.origin !== "generated" && (
                    <span className="rounded border border-white/[0.06] px-2 py-1 text-[10px] capitalize text-zinc-600">
                      {currentCard.origin}
                    </span>
                  )}
                </div>

                <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-200 sm:text-xl">
                  {currentCard.front}
                </p>

                {revealed && (
                  <div className="mt-10 border-t border-white/[0.06] pt-8">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                      Answer
                    </p>

                    <p className="max-w-3xl text-sm leading-7 text-zinc-500">
                      {currentCard.back}
                    </p>
                  </div>
                )}

                {!revealed && (
                  <button
                    type="button"
                    onClick={() => setRevealed(true)}
                    className="mt-10 flex items-center gap-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                  >
                    <ChevronDown size={14} />
                    Reveal answer
                  </button>
                )}
              </div>

              {revealed && (
                <div className="border-t border-white/[0.06] px-6 py-5 sm:px-10">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                    How well did you know this?
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {([1, 2, 3] as Confidence[]).map((level) => {
                      const selected = confidenceMap[currentCard.id] === level;

                      return (
                        <button
                          key={level}
                          type="button"
                          disabled={saving}
                          onClick={() => saveConfidence(level)}
                          className={[
                            "rounded-md border px-3 py-2 text-xs transition-colors",
                            selected
                              ? "border-white/[0.16] bg-white/[0.06] text-zinc-200"
                              : "border-white/[0.07] text-zinc-600 hover:border-white/[0.12] hover:text-zinc-300",
                            saving ? "cursor-wait opacity-60" : "",
                          ].join(" ")}
                        >
                          {confidenceLabels[level]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 rounded-md border border-white/[0.07] px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowLeft size={14} />
                Previous
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex === filteredFlashcards.length - 1}
                className="flex items-center gap-2 rounded-md border border-white/[0.07] px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        ) : (
          <div className="rounded-lg border border-dashed border-white/[0.08] py-16 text-center">
            {flashcards.length === 0 ? (
              <>
                <p className="text-sm text-zinc-500">
                  No flashcards have been generated yet.
                </p>

                <p className="mt-2 text-xs text-zinc-700">
                  Flashcards will appear here once they are generated for this
                  kit.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-500">
                  No flashcards match your search.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentIndex(0);
                  }}
                  className="mt-3 text-xs text-zinc-600 hover:text-zinc-300"
                >
                  Clear search
                </button>
              </>
            )}
          </div>
        )}

        {flashcards.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetReview}
              className="flex items-center gap-2 text-xs text-zinc-700 transition-colors hover:text-zinc-400"
            >
              <RotateCcw size={13} />
              Restart review
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
