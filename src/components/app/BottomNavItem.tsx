import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function BottomNavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "flex flex-col items-center gap-0.5 px-4 py-2 rounded-full text-[11px] " +
        (active ? "text-atlas-energy" : "text-atlas-muted hover:text-atlas-contrast")
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}
