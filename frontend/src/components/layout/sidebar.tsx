"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, BriefcaseBusiness, X } from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Interview Kits",
    href: "/kits/new",
    icon: BriefcaseBusiness,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col",
          "border-r border-white/20 bg-[#000000]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/20 px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[13px] font-bold text-black">
              P
            </div>

            <span className="text-[15px] font-semibold tracking-[-0.02em]">
              Prepora
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-300 hover:bg-white/[0.05] hover:text-zinc-200 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">
            Workspace
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                item.href === "/kits/new"
                  ? pathname.startsWith("/kits")
                  : pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={[
                    "flex h-9 items-center gap-3 rounded-md px-3",
                    "text-[13px] transition-colors",
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-300 hover:bg-white/[0.04] hover:text-zinc-200",
                  ].join(" ")}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/20 p-4">
          <div className="rounded-lg border border-white/20 bg-white/[0.02] p-3">
            <p className="text-xs font-medium text-zinc-300">
              Interview preparation
            </p>

            <p className="mt-1 text-[11px] leading-4 text-zinc-600">
              Build focused preparation kits from any job description.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
