"use client";

import { usePathname } from "next/navigation";
import { BottomNavItem } from "./BottomNavItem";
import { LayoutGrid, Users, Dumbbell, Bell, BarChart3 } from "lucide-react";

export function PersonalNav() {
  const path = usePathname();
  const items = [
    { href: "/personal", label: "Início", icon: LayoutGrid },
    { href: "/personal/alunos", label: "Alunos", icon: Users },
    { href: "/personal/treinos", label: "Treinos", icon: Dumbbell },
    { href: "/personal/avisos", label: "Avisos", icon: Bell },
    { href: "/personal/relatorios", label: "Relatórios", icon: BarChart3 },
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
