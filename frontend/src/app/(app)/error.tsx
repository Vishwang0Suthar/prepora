"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Prepora application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-white/[0.07] bg-[#0b0c0e] px-6 py-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-red-500/10 bg-red-500/[0.04] text-red-400/60">
          <AlertTriangle size={17} />
        </div>

        <h1 className="mt-5 text-sm font-medium text-zinc-300">
          Something went wrong
        </h1>

        <p className="mt-2 text-xs leading-5 text-zinc-600">
          Prepora couldn&apos;t load this part of the application. Try again,
          and if the problem continues, reload the page.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/[0.08] px-3 py-2 text-xs text-zinc-500 transition-colors hover:border-white/[0.14] hover:text-zinc-300"
        >
          <RotateCcw size={13} />
          Try again
        </button>
      </div>
    </main>
  );
}
