import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090a] text-zinc-100">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />

        <div className="text-center">
          <p className="text-sm font-medium text-zinc-200">Loading Prepora</p>
          <p className="mt-1 text-xs text-zinc-500">
            Preparing your workspace...
          </p>
        </div>
      </div>
    </main>
  );
}
