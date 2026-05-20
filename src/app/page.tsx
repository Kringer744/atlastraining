import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";

export default async function Root() {
  const s = await getSession();
  if (s) {
    if (s.role === "personal") redirect("/personal");
    if (s.role === "solo") redirect("/eu");
    redirect("/cliente");
  }
  redirect("/login");
}
