import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";

export default async function AppRouter() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role === "personal") redirect("/personal");
  if (s.role === "solo") redirect("/eu");
  redirect("/cliente");
}
