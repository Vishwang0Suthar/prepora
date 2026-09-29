"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Layers3,
  BrainCircuit,
  CalendarDays,
} from "lucide-react";

interface KitSidebarProps {
  kitId: string;
}

const items = [
  {
    label: "Overview",
    segment: "",
    icon: LayoutDashboard,
  },
  {
    label: "Questions",
    segment: "/questions",
    icon: MessageSquare,
  },
  {
    label: "Flashcards",
    segment: "/flashcards",
    icon: Layers3,
  },
  {
    label: "Practice",
    segment: "/practice",
    icon: BrainCircuit,
  },
  {
    label: "Schedule",
    segment: "/schedule",
    icon: CalendarDays,
  },
];

export function KitSidebar({ kitId }: KitSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="w-full">
      <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
        Interview kit
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const href = `/kits/${kitId}${item.segment}`;

          const active =
            item.segment === ""
              ? pathname === `/kits/${kitId}`
              : pathname.startsWith(href);

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={href}
              className={[
                "flex h-9 items-center gap-3 rounded-md px-3",
                "text-[13px] transition-colors",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-300 hover:bg-white/[0.04] hover:text-zinc-200",
              ].join(" ")}
            >
              <Icon size={15} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
