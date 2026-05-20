import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "client") redirect("/personal");
  return <>{children}</>;
}
