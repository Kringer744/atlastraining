import Link from "next/link";
import { AtlasLogo } from "@/components/brand/AtlasLogo";
import { signOutAction } from "@/app/(auth)/actions";
import { LogOut } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { AppFooterLinks } from "./AppFooterLinks";

export function AppShell({
  title,
  subtitle,
  actions,
  bottomNav,
  headerExtra,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  bottomNav?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh pb-24">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/app" className="flex items-center gap-3">
          <AtlasLogo size={32} withWordmark />
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {headerExtra}
          <form action={signOutAction}>
            <button
              type="submit"
              title="Sair"
              className="rounded-full bg-white/5 border border-white/10 p-2 hover:bg-white/10"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </header>

      <div className="px-5 max-w-5xl mx-auto">
        {(title || actions) && (
          <div className="flex items-end justify-between mb-4">
            <div>
              {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
              {subtitle && (
                <p className="text-atlas-muted text-sm mt-1">{subtitle}</p>
              )}
            </div>
            {actions}
          </div>
        )}
        {children}
        <AppFooterLinks />
      </div>

      {bottomNav && (
        <nav className="fixed bottom-0 inset-x-0 z-40">
          <div className="mx-auto max-w-5xl px-4 pb-4">
            <div className="rounded-full bg-atlas-focus-2/90 backdrop-blur border border-white/10 px-2 py-2 flex items-center justify-around">
              {bottomNav}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}

export { BottomNavItem } from "./BottomNavItem";
