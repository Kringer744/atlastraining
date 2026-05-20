"use client";

import { usePathname } from "next/navigation";
import { BottomNavItem } from "./BottomNavItem";
import { LayoutGrid, Dumbbell, Mountain, BarChart3 } from "lucide-react";

export function EuNav() {
  const path = usePathname();
  const items = [
    { href: "/eu", label: "Início", icon: LayoutGrid },
    { href: "/eu/treinos", label: "Treinos", icon: Dumbbell },
    { href: "/eu/ascensao", label: "Ascensão", icon: Mountain },
    { href: "/eu/evolucao", label: "Evolução", icon: BarChart3 },
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
