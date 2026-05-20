import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { count } from "@/lib/nocodb/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "client") {
    return NextResponse.json({ count: 0, show: false });
  }
  try {
    const c = await count(
      "reminders",
      `(client_id,eq,${session.sub})~and(read_at,is,null)`,
    );
    return NextResponse.json({ count: c, show: true });
  } catch {
    return NextResponse.json({ count: 0, show: true });
  }
}
