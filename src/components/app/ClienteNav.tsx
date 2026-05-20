"use client";

import { usePathname } from "next/navigation";
import { BottomNavItem } from "./AppShell";
import { LayoutGrid, Dumbbell, BarChart3, Trophy, Bell } from "lucide-react";

export function ClienteNav() {
  const path = usePathname();
  const items = [
    { href: "/cliente", label: "Início", icon: LayoutGrid },
    { href: "/cliente/treinos", label: "Treinos", icon: Dumbbell },
    { href: "/cliente/evolucao", label: "Evolução", icon: BarChart3 },
    { href: "/cliente/conquistas", label: "Medalhas", icon: Trophy },
    { href: "/cliente/avisos", label: "Avisos", icon: Bell },
  ];
  return (
    <>
      {items.map((it) => (
        <BottomNavItem
          key={it.href}
          {...it}
          active={path === it.href || path.startsWith(it.href + "/")}
        />
      ))}
    </>
  );
}
