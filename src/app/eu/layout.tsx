import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";

export default async function EuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "solo") {
    if (s.role === "personal") redirect("/personal");
    redirect("/cliente");
  }
  return <>{children}</>;
}
