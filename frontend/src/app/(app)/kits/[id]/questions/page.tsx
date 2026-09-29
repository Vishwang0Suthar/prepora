"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, Pin, Search, SlidersHorizontal } from "lucide-react";

import { KitSidebar } from "@/components/layout/kit-sidebar";
import { apiRequest } from "@/lib/api";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
type Category =
  | "all"
  | "technical"
  | "behavioural"
  | "system-design"
  | "company-fit";

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

export default function QuestionsPage() {
  const params = useParams();
  const kitId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [difficulty, setDifficulty] = useState<"all" | 1 | 2 | 3>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadQuestions = useCallback(async () => {
    try {
      const response = await apiRequest<KitResponse>(`/api/kits/${kitId}`);

      setQuestions(response.kit.kit?.questions ?? []);
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

      <main className="min-w-0 space-y-6">
        <header>
          <p className="text-xs text-zinc-600">Interview questions</p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white">
                Questions
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                {questions.length} questions generated from the role
                requirements.
              </p>
            </div>

            <div className="text-xs text-zinc-600">
              Showing{" "}
              <span className="text-zinc-300">{filteredQuestions.length}</span>
            </div>
          </div>
        </header>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions..."
                className="h-10 w-full rounded-md border border-white/[0.08] bg-[#0b0c0e] pl-9 pr-3 text-sm text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-white/[0.16]"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-zinc-700" />

              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(
                    event.target.value === "all"
                      ? "all"
                      : (Number(event.target.value) as 1 | 2 | 3),
                  )
                }
                className="h-10 rounded-md border border-white/[0.08] bg-[#0b0c0e] px-3 text-xs text-zinc-400 outline-none"
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
          {filteredQuestions.map((question, index) => {
            const expanded = expandedId === question.id;

            return (
              <article
                key={question.id}
                className="rounded-lg border border-white/[0.07] bg-[#0b0c0e]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : question.id)}
                  className="w-full px-5 py-5 text-left"
                >
                  <div className="flex gap-4">
                    <span className="mt-0.5 w-6 shrink-0 font-mono text-[11px] text-zinc-700">
                      {String(index + 1).padStart(2, "0")}
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
                            className="fill-zinc-500 text-zinc-500"
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
                        "mt-1 shrink-0 text-zinc-700 transition-transform",
                        expanded ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-white/[0.06] px-5 py-5 pl-[60px]">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                      Answer outline
                    </p>

                    <p className="max-w-3xl text-sm leading-7 text-zinc-500">
                      {question.answer_outline}
                    </p>
                  </div>
                )}
              </article>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/[0.08] py-16 text-center">
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
