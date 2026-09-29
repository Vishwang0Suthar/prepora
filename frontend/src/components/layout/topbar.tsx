"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu, Plus, Settings, User } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? null);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();

      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to sign out:", error);
      setSigningOut(false);
    }
  }

  const initials = email?.slice(0, 1).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/[0.07] bg-[#08090a]/90 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-5 sm:px-8 lg:px-10">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        <div className="hidden lg:block">
          <span className="text-xs text-zinc-600">Interview workspace</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/kits/new"
            className="flex h-8 items-center gap-2 rounded-md bg-white px-3 text-xs font-medium text-black transition-opacity hover:opacity-90"
          >
            <Plus size={14} />
            New kit
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open account menu"
              aria-expanded={menuOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-zinc-800 text-[11px] font-medium text-zinc-400 transition-colors hover:border-white/[0.18] hover:text-white"
            >
              {email ? initials : <User size={14} />}
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close account menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />

                <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d0e10] shadow-2xl shadow-black/40">
                  <div className="border-b border-white/[0.06] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                      Account
                    </p>

                    <p className="mt-1 truncate text-xs text-zinc-400">
                      {email || "Signed in"}
                    </p>
                  </div>

                  <div className="p-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-xs text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-200"
                    >
                      <Settings size={14} />
                      Settings
                    </Link>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LogOut size={14} />

                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
