"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  FileQuestion,
  Loader2,
  Pin,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { KitSidebar } from "@/components/layout/kit-sidebar";
import { apiRequest } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

type QuestionCategory =
  | "technical"
  | "behavioural"
  | "system-design"
  | "company-fit";

type Category = "all" | QuestionCategory;

type Difficulty = 1 | 2 | 3;

interface Question {
  id: string;
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: Difficulty;
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

interface QuestionResponse {
  ok: boolean;
  question: Question;
}

const filters: {
  value: Category;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "technical",
    label: "Technical",
  },
  {
    value: "behavioural",
    label: "Behavioural",
  },
  {
    value: "system-design",
    label: "System design",
  },
  {
    value: "company-fit",
    label: "Company fit",
  },
];

const categoryOptions: {
  value: QuestionCategory;
  label: string;
}[] = [
  {
    value: "technical",
    label: "Technical",
  },
  {
    value: "behavioural",
    label: "Behavioural",
  },
  {
    value: "system-design",
    label: "System design",
  },
  {
    value: "company-fit",
    label: "Company fit",
  },
];

const difficultyOptions: {
  value: Difficulty;
  label: string;
}[] = [
  {
    value: 1,
    label: "Easy",
  },
  {
    value: 2,
    label: "Medium",
  },
  {
    value: 3,
    label: "Hard",
  },
];

export default function QuestionsPage() {
  const params = useParams();
  const kitId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [draftCategory, setDraftCategory] =
    useState<QuestionCategory>("technical");
  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty>(2);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState<QuestionCategory>("technical");
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>(2);
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<KitResponse>(`/api/kits/${kitId}`);

      setQuestions(response.kit.kit?.questions ?? []);
    } catch (err) {
      console.error("Failed to load questions:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load interview questions.",
      );
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return questions.filter((question) => {
      const matchesCategory =
        category === "all" || question.category === category;

      const matchesDifficulty =
        difficulty === "all" || question.difficulty === difficulty;

      const matchesSearch =
        !query ||
        question.prompt.toLowerCase().includes(query) ||
        question.answer_outline.toLowerCase().includes(query);

      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [questions, search, category, difficulty]);

  function startEditing(question: Question) {
    setActionError(null);
    setEditingId(question.id);
    setDraftPrompt(question.prompt);
    setDraftAnswer(question.answer_outline);
    setDraftCategory(question.category);
    setDraftDifficulty(question.difficulty);
    setExpandedId(question.id);
  }

  function cancelEditing() {
    if (savingId) {
      return;
    }

    setEditingId(null);
    setDraftPrompt("");
    setDraftAnswer("");
  }

  async function saveQuestion(questionId: string) {
    if (!draftPrompt.trim()) {
      setActionError("Question prompt cannot be empty.");
      return;
    }

    if (!draftAnswer.trim()) {
      setActionError("Answer outline cannot be empty.");
      return;
    }

    const previous = questions;

    const optimisticQuestion = questions.find(
      (question) => question.id === questionId,
    );

    if (!optimisticQuestion) {
      return;
    }

    const updatedQuestion: Question = {
      ...optimisticQuestion,
      prompt: draftPrompt.trim(),
      answer_outline: draftAnswer.trim(),
      category: draftCategory,
      difficulty: draftDifficulty,
      origin: optimisticQuestion.origin === "manual" ? "manual" : "edited",
    };

    setActionError(null);
    setSavingId(questionId);

    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? updatedQuestion : question,
      ),
    );

    try {
      const response = await apiRequest<QuestionResponse>(
        `/api/kits/${kitId}/questions/${questionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            prompt: updatedQuestion.prompt,
            answer_outline: updatedQuestion.answer_outline,
            category: updatedQuestion.category,
            difficulty: updatedQuestion.difficulty,
            pinned: updatedQuestion.pinned,
          }),
        },
      );

      setQuestions((current) =>
        current.map((question) =>
          question.id === questionId ? response.question : question,
        ),
      );

      setEditingId(null);
      setDraftPrompt("");
      setDraftAnswer("");
    } catch (err) {
      console.error("Failed to update question:", err);

      setQuestions(previous);

      setActionError(
        err instanceof Error ? err.message : "Unable to save this question.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function togglePin(question: Question) {
    const previous = questions;

    const updatedQuestion: Question = {
      ...question,
      pinned: !question.pinned,
    };

    setActionError(null);

    setQuestions((current) =>
      current.map((item) => (item.id === question.id ? updatedQuestion : item)),
    );

    try {
      const response = await apiRequest<QuestionResponse>(
        `/api/kits/${kitId}/questions/${question.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            prompt: question.prompt,
            answer_outline: question.answer_outline,
            category: question.category,
            difficulty: question.difficulty,
            pinned: updatedQuestion.pinned,
          }),
        },
      );

      setQuestions((current) =>
        current.map((item) =>
          item.id === question.id ? response.question : item,
        ),
      );
    } catch (err) {
      console.error("Failed to update pin state:", err);

      setQuestions(previous);

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update the pinned state.",
      );
    }
  }

  async function deleteQuestion(questionId: string) {
    const previous = questions;

    setActionError(null);
    setDeletingId(questionId);

    setQuestions((current) =>
      current.filter((question) => question.id !== questionId),
    );

    if (expandedId === questionId) {
      setExpandedId(null);
    }

    if (editingId === questionId) {
      cancelEditing();
    }

    try {
      await apiRequest(`/api/kits/${kitId}/questions/${questionId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete question:", err);

      setQuestions(previous);

      setActionError(
        err instanceof Error ? err.message : "Unable to delete this question.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function moveQuestion(questionId: string, direction: "up" | "down") {
    const index = questions.findIndex((question) => question.id === questionId);

    if (index === -1) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= questions.length) {
      return;
    }

    const previous = questions;
    const reordered = [...questions];

    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];

    setActionError(null);
    setReorderingId(questionId);
    setQuestions(reordered);

    try {
      const response = await apiRequest<{
        ok: boolean;
        questions: Question[];
      }>(`/api/kits/${kitId}/questions/reorder`, {
        method: "PATCH",
        body: JSON.stringify({
          question_ids: reordered.map((question) => question.id),
        }),
      });

      setQuestions(response.questions);
    } catch (err) {
      console.error("Failed to reorder questions:", err);

      setQuestions(previous);

      setActionError(
        err instanceof Error ? err.message : "Unable to reorder questions.",
      );
    } finally {
      setReorderingId(null);
    }
  }

  async function addQuestion() {
    if (!newPrompt.trim()) {
      setActionError("Question prompt cannot be empty.");
      return;
    }

    if (!newAnswer.trim()) {
      setActionError("Answer outline cannot be empty.");
      return;
    }

    setActionError(null);
    setAdding(true);

    try {
      const response = await apiRequest<QuestionResponse>(
        `/api/kits/${kitId}/questions`,
        {
          method: "POST",
          body: JSON.stringify({
            prompt: newPrompt.trim(),
            answer_outline: newAnswer.trim(),
            category: newCategory,
            difficulty: newDifficulty,
          }),
        },
      );

      setQuestions((current) => [...current, response.question]);

      setNewPrompt("");
      setNewAnswer("");
      setNewCategory("technical");
      setNewDifficulty(2);
      setShowAddForm(false);
      setExpandedId(response.question.id);
    } catch (err) {
      console.error("Failed to add question:", err);

      setActionError(
        err instanceof Error ? err.message : "Unable to add the question.",
      );
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-xl">
          <ErrorState
            title="Unable to load questions"
            description={error}
            action={
              <button
                type="button"
                onClick={loadQuestions}
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

      <main className="min-w-0 space-y-6">
        <header>
          <p className="text-xs text-zinc-600">Interview questions</p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white">
                Questions
              </h1>

              <p className="mt-2 text-sm text-zinc-300">
                {questions.length} questions generated from the role
                requirements.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setShowAddForm((value) => !value);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <Plus size={14} />
              Add question
            </button>
          </div>
        </header>

        {actionError && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-red-500/20 bg-red-500/[0.05] px-3 py-2.5 text-xs text-red-300">
            <span>{actionError}</span>

            <button
              type="button"
              onClick={() => setActionError(null)}
              className="shrink-0 text-red-400 hover:text-red-200"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {showAddForm && (
          <section className="rounded-lg border border-white/20 bg-[#000000] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Add question
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Create a manual question for this kit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-zinc-600 transition-colors hover:text-zinc-300"
                aria-label="Close add question form"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Question">
                <textarea
                  value={newPrompt}
                  onChange={(event) => setNewPrompt(event.target.value)}
                  rows={3}
                  placeholder="Write the interview question..."
                  className="w-full resize-y rounded-md border border-white/20 bg-[#08090b] px-3 py-2.5 text-sm leading-6 text-zinc-300 outline-none placeholder:text-zinc-500 focus:border-white/40"
                />
              </Field>

              <Field label="Answer outline">
                <textarea
                  value={newAnswer}
                  onChange={(event) => setNewAnswer(event.target.value)}
                  rows={4}
                  placeholder="Write the key points a strong answer should cover..."
                  className="w-full resize-y rounded-md border border-white/20 bg-[#08090b] px-3 py-2.5 text-sm leading-6 text-zinc-300 outline-none placeholder:text-zinc-500 focus:border-white/40"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category">
                  <select
                    value={newCategory}
                    onChange={(event) =>
                      setNewCategory(event.target.value as QuestionCategory)
                    }
                    className="h-10 w-full rounded-md border border-white/20 bg-[#08090b] px-3 text-xs text-zinc-400 outline-none"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Difficulty">
                  <select
                    value={newDifficulty}
                    onChange={(event) =>
                      setNewDifficulty(Number(event.target.value) as Difficulty)
                    }
                    className="h-10 w-full rounded-md border border-white/20 bg-[#08090b] px-3 text-xs text-zinc-400 outline-none"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-md px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={adding}
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  {adding ? "Adding..." : "Add question"}
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions..."
                className="h-10 w-full rounded-md border border-white/20 bg-[#000000] pl-9 pr-3 text-sm text-zinc-300 outline-none placeholder:text-zinc-500 focus:border-white/40"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-zinc-500" />

              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(
                    event.target.value === "all"
                      ? "all"
                      : (Number(event.target.value) as Difficulty),
                  )
                }
                className="h-10 rounded-md border border-white/20 bg-[#000000] px-3 text-xs text-zinc-400 outline-none"
              >
                <option value="all">All difficulties</option>
                <option value="1">Easy</option>
                <option value="2">Medium</option>
                <option value="3">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setCategory(filter.value)}
                className={[
                  "shrink-0 rounded-md px-3 py-2 text-xs transition-colors",
                  category === filter.value
                    ? "bg-white/[0.08] text-zinc-200"
                    : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400",
                ].join(" ")}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredQuestions.map((question) => {
            const expanded = expandedId === question.id;
            const editing = editingId === question.id;
            const saving = savingId === question.id;
            const deleting = deletingId === question.id;
            const reordering = reorderingId === question.id;

            const fullIndex = questions.findIndex(
              (item) => item.id === question.id,
            );

            const canMoveUp = fullIndex > 0;
            const canMoveDown =
              fullIndex >= 0 && fullIndex < questions.length - 1;

            return (
              <article
                key={question.id}
                className="rounded-lg border border-white/20 bg-[#000000]"
              >
                <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
                  <div className="flex shrink-0 flex-col gap-1 pt-1">
                    <button
                      type="button"
                      disabled={!canMoveUp || reordering}
                      onClick={() => moveQuestion(question.id, "up")}
                      className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300 disabled:pointer-events-none disabled:opacity-20"
                      aria-label="Move question up"
                    >
                      <ArrowUp size={13} />
                    </button>

                    <button
                      type="button"
                      disabled={!canMoveDown || reordering}
                      onClick={() => moveQuestion(question.id, "down")}
                      className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300 disabled:pointer-events-none disabled:opacity-20"
                      aria-label="Move question down"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    {!editing ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : question.id)
                        }
                        className="w-full text-left"
                      >
                        <div className="flex gap-4">
                          <span className="mt-0.5 w-6 shrink-0 font-mono text-[11px] text-zinc-500">
                            {String(fullIndex + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <Badge>{question.category}</Badge>

                              <Difficulty value={question.difficulty} />

                              {question.origin !== "generated" && (
                                <Badge>{question.origin}</Badge>
                              )}

                              {question.pinned && (
                                <Pin
                                  size={12}
                                  className="fill-zinc-500 text-zinc-300"
                                />
                              )}
                            </div>

                            <p className="text-sm leading-6 text-zinc-300">
                              {question.prompt}
                            </p>
                          </div>

                          <ChevronDown
                            size={16}
                            className={[
                              "mt-1 shrink-0 text-zinc-500 transition-transform",
                              expanded ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-zinc-500">
                            {String(fullIndex + 1).padStart(2, "0")}
                          </span>

                          <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                            Editing
                          </span>
                        </div>

                        <Field label="Question">
                          <textarea
                            value={draftPrompt}
                            onChange={(event) =>
                              setDraftPrompt(event.target.value)
                            }
                            rows={3}
                            className="w-full resize-y rounded-md border border-white/20 bg-[#08090b] px-3 py-2.5 text-sm leading-6 text-zinc-300 outline-none focus:border-white/40"
                          />
                        </Field>

                        <Field label="Answer outline">
                          <textarea
                            value={draftAnswer}
                            onChange={(event) =>
                              setDraftAnswer(event.target.value)
                            }
                            rows={5}
                            className="w-full resize-y rounded-md border border-white/20 bg-[#08090b] px-3 py-2.5 text-sm leading-6 text-zinc-300 outline-none focus:border-white/40"
                          />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Category">
                            <select
                              value={draftCategory}
                              onChange={(event) =>
                                setDraftCategory(
                                  event.target.value as QuestionCategory,
                                )
                              }
                              className="h-10 w-full rounded-md border border-white/20 bg-[#08090b] px-3 text-xs text-zinc-400 outline-none"
                            >
                              {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Difficulty">
                            <select
                              value={draftDifficulty}
                              onChange={(event) =>
                                setDraftDifficulty(
                                  Number(event.target.value) as Difficulty,
                                )
                              }
                              className="h-10 w-full rounded-md border border-white/20 bg-[#08090b] px-3 text-xs text-zinc-400 outline-none"
                            >
                              {difficultyOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={cancelEditing}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300 disabled:opacity-40"
                          >
                            <X size={13} />
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveQuestion(question.id)}
                            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Save size={13} />
                            )}
                            {saving ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      </div>
                    )}

                    {!editing && expanded && (
                      <div className="mt-5 border-t border-white/20 pt-5">
                        <div className="pl-0 sm:pl-10">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Answer outline
                          </p>

                          <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                            {question.answer_outline}
                          </p>

                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            <a
                              href={`/kits/${kitId}/practice?question=${question.id}`}
                              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03] hover:text-zinc-200"
                            >
                              Practice this question
                              <ArrowRight size={13} />
                            </a>

                            <button
                              type="button"
                              onClick={() => startEditing(question)}
                              className="rounded-md border border-white/20 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03] hover:text-zinc-200"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => togglePin(question)}
                              className={[
                                "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
                                question.pinned
                                  ? "border-white/[0.12] bg-white/[0.05] text-zinc-300"
                                  : "border-white/20 text-zinc-300 hover:border-white/[0.12] hover:bg-white/[0.03] hover:text-zinc-200",
                              ].join(" ")}
                            >
                              <Pin
                                size={13}
                                className={
                                  question.pinned ? "fill-current" : ""
                                }
                              />
                              {question.pinned ? "Pinned" : "Pin"}
                            </button>

                            <button
                              type="button"
                              disabled={deleting}
                              onClick={() => deleteQuestion(question.id)}
                              className="inline-flex items-center gap-2 rounded-md border border-red-500/10 px-3 py-2 text-xs text-red-400/70 transition-colors hover:border-red-500/20 hover:bg-red-500/[0.05] hover:text-red-300 disabled:opacity-40"
                            >
                              {deleting ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                              {deleting ? "Deleting..." : "Delete"}
                            </button>

                            {reordering && (
                              <span className="inline-flex items-center gap-2 text-[11px] text-zinc-500">
                                <Loader2 size={12} className="animate-spin" />
                                Saving order
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/20 py-16 text-center">
              <EmptyState
                icon={FileQuestion}
                title={
                  search || category !== "all" || difficulty !== "all"
                    ? "No matching questions"
                    : "No questions yet"
                }
                description={
                  search || category !== "all" || difficulty !== "all"
                    ? "Try adjusting your search or filters to find more questions."
                    : "Questions will appear here once your interview kit has finished generating."
                }
              />

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setDifficulty("all");
                }}
                className="mt-3 text-xs text-zinc-600 hover:text-zinc-300"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-white/20 px-2 py-1 text-xs capitalize text-zinc-600">
      {children}
    </span>
  );
}

function Difficulty({ value }: { value: Difficulty }) {
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
