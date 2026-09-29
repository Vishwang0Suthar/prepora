"use client";

import { useEffect, useState } from "react";
import { Check, LogOut, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? null);
      setLoading(false);
    }

    loadUser();
  }, []);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs text-zinc-600">Application</p>

        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
          Settings
        </h1>

        <p className="mt-2 text-sm text-zinc-300">
          Manage your Prepora account and session.
        </p>
      </header>

      <section className="rounded-lg border border-white/20 bg-[#000000]">
        <div className="border-b border-white/20 px-5 py-4">
          <h2 className="text-sm font-medium text-zinc-200">Account</h2>

          <p className="mt-1 text-xs text-zinc-600">
            Your authenticated Supabase account.
          </p>
        </div>

        <div className="divide-y divide-white/[0.05]">
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/[0.02] text-zinc-600">
              <User size={15} />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Account email</p>

              <p className="mt-1 truncate text-sm text-zinc-300">
                {loading ? "Loading..." : email || "Unknown"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/[0.02] text-zinc-600">
              <Mail size={15} />
            </div>

            <div>
              <p className="text-xs text-zinc-500">Authentication</p>

              <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                <Check size={13} />
                Supabase authentication
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-red-500/[0.08] bg-[#000000]">
        <div className="border-b border-red-500/[0.06] px-5 py-4">
          <h2 className="text-sm font-medium text-zinc-200">Session</h2>

          <p className="mt-1 text-xs text-zinc-600">
            Sign out from this Prepora session.
          </p>
        </div>

        <div className="flex items-center justify-between gap-5 px-5 py-5">
          <div>
            <p className="text-sm text-zinc-400">Sign out</p>

            <p className="mt-1 text-xs text-zinc-500">
              You can sign back in at any time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex shrink-0 items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-red-500/[0.15] hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={13} />

            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </section>
    </main>
  );
}
