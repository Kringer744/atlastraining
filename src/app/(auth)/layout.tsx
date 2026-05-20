import Link from "next/link";
import { AtlasLogo } from "@/components/brand/AtlasLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-md mx-auto w-full">
        <Link href="/">
          <AtlasLogo withWordmark />
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
