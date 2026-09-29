"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { KitSidebar } from "@/components/layout/kit-sidebar";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

interface FlashcardDraft {
  front: string;
  back: string;
}

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
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<FlashcardDraft>({
    front: "",
    back: "",
  });

  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState<FlashcardDraft>({
    front: "",
    back: "",
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFlashcards = useCallback(async () => {
    setLoading(true);
    setError(null);

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

      setError(
        error instanceof Error ? error.message : "Unable to load flashcards.",
      );
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

      if (aConfidence !== bConfidence) {
        return aConfidence - bConfidence;
      }

      return (
        flashcards.findIndex((card) => card.id === a.id) -
        flashcards.findIndex((card) => card.id === b.id)
      );
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

    const previousConfidence = confidenceMap[currentCard.id];
    const previousProgress = progress;

    setConfidenceMap((previous) => ({
      ...previous,
      [currentCard.id]: confidence,
    }));

    setSaving(true);
    setError(null);

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

        const now = new Date().toISOString();

        const updatedItem: PracticeProgress = {
          id:
            existingIndex >= 0
              ? previous[existingIndex].id
              : `local-${currentCard.id}`,
          item_type: "flashcard",
          item_id: currentCard.id,
          status: "completed",
          confidence_rating: confidence,
          last_reviewed_at: now,
          updated_at: now,
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

      setConfidenceMap((previous) => {
        const next = { ...previous };

        if (previousConfidence === undefined) {
          delete next[currentCard.id];
        } else {
          next[currentCard.id] = previousConfidence;
        }

        return next;
      });

      setProgress(previousProgress);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save flashcard progress.",
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (card: Flashcard) => {
    setEditingId(card.id);
    setEditingDraft({
      front: card.front,
      back: card.back,
    });
    setRevealed(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingDraft({
      front: "",
      back: "",
    });
  };

  const saveEditing = async () => {
    if (!editingId) return;

    const front = editingDraft.front.trim();
    const back = editingDraft.back.trim();

    if (!front || !back) {
      setError("Both the front and back of the flashcard are required.");
      return;
    }

    const previousCards = flashcards;
    const previousCard = flashcards.find((card) => card.id === editingId);

    if (!previousCard) return;

    const updatedCard: Flashcard = {
      ...previousCard,
      front,
      back,
      origin: previousCard.origin === "manual" ? "manual" : "edited",
    };

    setFlashcards((previous) =>
      previous.map((card) => (card.id === editingId ? updatedCard : card)),
    );

    setSaving(true);
    setError(null);

    try {
      const response = await apiRequest<{
        ok: boolean;
        flashcard: Flashcard;
      }>(`/api/kits/${kitId}/flashcards/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          front,
          back,
        }),
      });

      setFlashcards((previous) =>
        previous.map((card) =>
          card.id === editingId ? response.flashcard : card,
        ),
      );

      cancelEditing();
    } catch (error) {
      console.error("Failed to update flashcard:", error);

      setFlashcards(previousCards);

      setError(
        error instanceof Error ? error.message : "Unable to update flashcard.",
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (card: Flashcard) => {
    const previousCards = flashcards;

    setFlashcards((previous) =>
      previous.map((item) =>
        item.id === card.id ? { ...item, pinned: !item.pinned } : item,
      ),
    );

    setSaving(true);
    setError(null);

    try {
      const response = await apiRequest<{
        ok: boolean;
        flashcard: Flashcard;
      }>(`/api/kits/${kitId}/flashcards/${card.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          pinned: !card.pinned,
        }),
      });

      setFlashcards((previous) =>
        previous.map((item) =>
          item.id === card.id ? response.flashcard : item,
        ),
      );
    } catch (error) {
      console.error("Failed to update flashcard pin:", error);

      setFlashcards(previousCards);

      setError(
        error instanceof Error ? error.message : "Unable to update flashcard.",
      );
    } finally {
      setSaving(false);
    }
  };

  const createFlashcard = async () => {
    const front = createDraft.front.trim();
    const back = createDraft.back.trim();

    if (!front || !back) {
      setError("Both the front and back of the flashcard are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiRequest<{
        ok: boolean;
        flashcard: Flashcard;
      }>(`/api/kits/${kitId}/flashcards`, {
        method: "POST",
        body: JSON.stringify({
          front,
          back,
          requirement_ids: [],
          pinned: false,
        }),
      });

      setFlashcards((previous) => [...previous, response.flashcard]);

      setCreateDraft({
        front: "",
        back: "",
      });

      setShowCreate(false);

      setSearch("");
      setCurrentIndex(flashcards.length);
      setRevealed(false);
    } catch (error) {
      console.error("Failed to create flashcard:", error);

      setError(
        error instanceof Error ? error.message : "Unable to create flashcard.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteFlashcard = async (card: Flashcard) => {
    if (deletingId || saving) return;

    const confirmed = window.confirm(
      "Delete this flashcard? This action cannot be undone.",
    );

    if (!confirmed) return;

    const previousCards = flashcards;

    setDeletingId(card.id);
    setError(null);

    setFlashcards((previous) => previous.filter((item) => item.id !== card.id));

    if (editingId === card.id) {
      cancelEditing();
    }

    try {
      await apiRequest(`/api/kits/${kitId}/flashcards/${card.id}`, {
        method: "DELETE",
      });

      setConfidenceMap((previous) => {
        const next = { ...previous };
        delete next[card.id];
        return next;
      });

      setProgress((previous) =>
        previous.filter(
          (item) =>
            !(item.item_type === "flashcard" && item.item_id === card.id),
        ),
      );

      setCurrentIndex((previous) =>
        Math.min(previous, Math.max(0, filteredFlashcards.length - 2)),
      );

      setRevealed(false);
    } catch (error) {
      console.error("Failed to delete flashcard:", error);

      setFlashcards(previousCards);

      setError(
        error instanceof Error ? error.message : "Unable to delete flashcard.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const moveFlashcard = async (cardId: string, direction: -1 | 1) => {
    const currentPosition = flashcards.findIndex((card) => card.id === cardId);

    if (currentPosition === -1) return;

    const targetPosition = currentPosition + direction;

    if (targetPosition < 0 || targetPosition >= flashcards.length || saving) {
      return;
    }

    const previousCards = flashcards;
    const reordered = [...flashcards];

    const [moved] = reordered.splice(currentPosition, 1);
    reordered.splice(targetPosition, 0, moved);

    setFlashcards(reordered);
    setSaving(true);
    setError(null);

    try {
      await apiRequest(`/api/kits/${kitId}/flashcards/reorder`, {
        method: "PATCH",
        body: JSON.stringify({
          flashcard_ids: reordered.map((card) => card.id),
        }),
      });
    } catch (error) {
      console.error("Failed to reorder flashcards:", error);

      setFlashcards(previousCards);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to reorder flashcards.",
      );
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
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error && flashcards.length === 0 && !showCreate) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-xl">
          <ErrorState
            title="Unable to load flashcards"
            description={error}
            action={
              <button
                type="button"
                onClick={loadFlashcards}
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

      <main className="min-w-0 space-y-7">
        <div>
          <p className="text-xs text-zinc-600">Interview preparation</p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white">
                Flashcards
              </h1>

              <p className="mt-2 text-sm text-zinc-300">
                Build, edit, and review concepts from your role requirements.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs text-zinc-600">
                <span className="text-zinc-300">{studiedCount}</span> of{" "}
                <span className="text-zinc-300">{flashcards.length}</span>{" "}
                studied
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCreate(true);
                  setError(null);
                }}
                className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-200"
              >
                <Plus size={14} />
                Add flashcard
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/10 bg-red-500/[0.03] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs leading-5 text-red-400/80">{error}</p>

              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 text-xs text-zinc-300 transition-colors hover:text-zinc-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="rounded-lg border border-white/20 bg-[#000000]">
            <div className="flex items-center justify-between border-b border-white/20 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  New flashcard
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Add a custom concept to this interview kit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setCreateDraft({
                    front: "",
                    back: "",
                  });
                }}
                className="text-zinc-600 transition-colors hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Front
                </label>

                <textarea
                  value={createDraft.front}
                  onChange={(event) =>
                    setCreateDraft((previous) => ({
                      ...previous,
                      front: event.target.value,
                    }))
                  }
                  placeholder="Question or concept..."
                  rows={3}
                  className="w-full resize-none rounded-md border border-white/20 bg-[#08090a] px-3 py-3 text-sm leading-6 text-zinc-300 outline-none placeholder:text-zinc-500 focus:border-white/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Back
                </label>

                <textarea
                  value={createDraft.back}
                  onChange={(event) =>
                    setCreateDraft((previous) => ({
                      ...previous,
                      back: event.target.value,
                    }))
                  }
                  placeholder="Answer or explanation..."
                  rows={5}
                  className="w-full resize-none rounded-md border border-white/20 bg-[#08090a] px-3 py-3 text-sm leading-6 text-zinc-300 outline-none placeholder:text-zinc-500 focus:border-white/40"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setCreateDraft({
                      front: "",
                      back: "",
                    });
                  }}
                  className="rounded-md border border-white/20 px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={createFlashcard}
                  className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-50"
                >
                  <Plus size={14} />
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {flashcards.length > 0 && (
          <div className="rounded-lg border border-white/20 bg-[#000000] px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
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
          </div>
        )}

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentIndex(0);
              setRevealed(false);
            }}
            placeholder="Search flashcards..."
            className="h-10 w-full rounded-md border border-white/20 bg-[#000000] pl-9 pr-3 text-sm text-zinc-300 outline-none placeholder:text-zinc-500 focus:border-white/40"
          />
        </div>

        {currentCard ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <span className="font-mono text-[11px] text-zinc-500">
                {String(currentIndex + 1).padStart(2, "0")} /{" "}
                {String(filteredFlashcards.length).padStart(2, "0")}
              </span>

              <div className="flex items-center gap-2">
                {currentCard.pinned && (
                  <Pin size={13} className="fill-zinc-500 text-zinc-300" />
                )}

                <span className="text-xs capitalize text-zinc-500">
                  {currentCard.origin}
                </span>
              </div>
            </div>

            <article className="overflow-hidden rounded-lg border border-white/20 bg-[#000000]">
              {editingId === currentCard.id ? (
                <div className="space-y-5 px-6 py-6 sm:px-10">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      Front
                    </label>

                    <textarea
                      value={editingDraft.front}
                      onChange={(event) =>
                        setEditingDraft((previous) => ({
                          ...previous,
                          front: event.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full resize-none rounded-md border border-white/20 bg-[#08090a] px-3 py-3 text-sm leading-6 text-zinc-300 outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      Back
                    </label>

                    <textarea
                      value={editingDraft.back}
                      onChange={(event) =>
                        setEditingDraft((previous) => ({
                          ...previous,
                          back: event.target.value,
                        }))
                      }
                      rows={7}
                      className="w-full resize-none rounded-md border border-white/20 bg-[#08090a] px-3 py-3 text-sm leading-6 text-zinc-300 outline-none focus:border-white/40"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                    >
                      <X size={13} />
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveEditing}
                      className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      <Save size={13} />
                      Save changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-6 py-10 sm:px-10 sm:py-14">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-white/20 px-2 py-1 text-xs uppercase tracking-[0.08em] text-zinc-600">
                        Flashcard
                      </span>

                      {currentCard.origin !== "generated" && (
                        <span className="rounded border border-white/20 px-2 py-1 text-xs capitalize text-zinc-600">
                          {currentCard.origin}
                        </span>
                      )}
                    </div>

                    <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-200 sm:text-xl">
                      {currentCard.front}
                    </p>

                    {revealed && (
                      <div className="mt-10 border-t border-white/20 pt-8">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          Answer
                        </p>

                        <p className="max-w-3xl text-sm leading-7 text-zinc-300">
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
                    <div className="border-t border-white/20 px-6 py-5 sm:px-10">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        How well did you know this?
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {([1, 2, 3] as Confidence[]).map((level) => {
                          const selected =
                            confidenceMap[currentCard.id] === level;

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
                                  : "border-white/20 text-zinc-600 hover:border-white/[0.12] hover:text-zinc-300",
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
                </>
              )}

              {editingId !== currentCard.id && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 px-6 py-4 sm:px-10">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => startEditing(currentCard)}
                      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-zinc-600 transition-colors hover:bg-white/[0.03] hover:text-zinc-300 disabled:opacity-40"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => togglePin(currentCard)}
                      className={[
                        "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs transition-colors hover:bg-white/[0.03]",
                        currentCard.pinned
                          ? "text-zinc-300"
                          : "text-zinc-600 hover:text-zinc-300",
                      ].join(" ")}
                    >
                      <Pin
                        size={13}
                        className={currentCard.pinned ? "fill-zinc-400" : ""}
                      />
                      {currentCard.pinned ? "Unpin" : "Pin"}
                    </button>

                    <button
                      type="button"
                      disabled={saving || deletingId === currentCard.id}
                      onClick={() => deleteFlashcard(currentCard)}
                      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-zinc-600 transition-colors hover:bg-red-500/[0.04] hover:text-red-400 disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                      {deletingId === currentCard.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={
                        saving ||
                        flashcards.findIndex(
                          (card) => card.id === currentCard.id,
                        ) <= 0
                      }
                      onClick={() => moveFlashcard(currentCard.id, -1)}
                      title="Move up"
                      className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-white/[0.03] hover:text-zinc-300 disabled:opacity-20"
                    >
                      <ArrowUp size={14} />
                    </button>

                    <button
                      type="button"
                      disabled={
                        saving ||
                        flashcards.findIndex(
                          (card) => card.id === currentCard.id,
                        ) >=
                          flashcards.length - 1
                      }
                      onClick={() => moveFlashcard(currentCard.id, 1)}
                      title="Move down"
                      className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-white/[0.03] hover:text-zinc-300 disabled:opacity-20"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              )}
            </article>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowLeft size={14} />
                Previous
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex === filteredFlashcards.length - 1}
                className="flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title={
              flashcards.length === 0
                ? "No flashcards yet"
                : "No matching flashcards"
            }
            description={
              flashcards.length === 0
                ? "Create your first custom flashcard or wait for the interview kit to finish generating."
                : "Try a different search term to find another flashcard."
            }
            action={
              flashcards.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentIndex(0);
                  }}
                  className="text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                >
                  Clear search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-200"
                >
                  <Plus size={14} />
                  Add flashcard
                </button>
              )
            }
          />
        )}

        {flashcards.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetReview}
              className="flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-zinc-400"
            >
              <RotateCcw size={13} />
              Start review again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
