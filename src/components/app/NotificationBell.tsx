"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

type Resp = { count: number; show: boolean };

export function NotificationBell() {
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      try {
        const r = await fetch("/api/notifications/unread", { cache: "no-store" });
        if (!r.ok) return;
        const json = (await r.json()) as Resp;
        if (mounted) setData(json);
      } catch {
        // silencioso
      }
    }
    fetchUnread();
    const t = setInterval(fetchUnread, 60_000); // refresh a cada 60s
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  if (!data?.show) return null;
  const { count } = data;

  return (
    <Link
      href="/cliente/avisos"
      title="Avisos"
      className="relative rounded-full bg-white/5 border border-white/10 p-2 hover:bg-white/10 transition"
    >
      <Bell size={16} />
      {count > 0 && (
        <>
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-atlas-energy text-black text-[10px] font-bold flex items-center justify-center shadow-glow">
            {count > 9 ? "9+" : count}
          </span>
          <span className="atlas-pulse-dot absolute top-1 right-1 w-2 h-2 rounded-full bg-atlas-energy pointer-events-none" />
        </>
      )}
    </Link>
  );
}
