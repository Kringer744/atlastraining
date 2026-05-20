import Link from "next/link";

export function AppFooterLinks() {
  return (
    <div className="text-[10px] text-atlas-muted text-center mt-6 mb-2 space-x-2">
      <Link href="/privacidade" className="hover:text-atlas-energy">Privacidade</Link>
      <span>·</span>
      <Link href="/termos" className="hover:text-atlas-energy">Termos</Link>
      <span>·</span>
      <span>Atlas Training · LGPD</span>
    </div>
  );
}
