"use client";

import { useEffect, useState } from "react";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-[248px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <section className="min-h-[calc(100vh-64px)]">
          <div className="mx-auto w-full max-w-[1440px] py-6">{children}</div>
        </section>
      </div>
    </div>
  );
}
