"use client";

import { usePathname } from "next/navigation";
import { BottomNavItem } from "./BottomNavItem";
import { LayoutGrid, Dumbbell, Mountain, Trophy, BarChart3 } from "lucide-react";

export function ClienteNav() {
  const path = usePathname();
  const items = [
    { href: "/cliente", label: "Início", icon: LayoutGrid },
    { href: "/cliente/treinos", label: "Treinos", icon: Dumbbell },
    { href: "/cliente/ascensao", label: "Ascensão", icon: Mountain },
    { href: "/cliente/ranking", label: "Ranking", icon: Trophy },
    { href: "/cliente/evolucao", label: "Evolução", icon: BarChart3 },
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
