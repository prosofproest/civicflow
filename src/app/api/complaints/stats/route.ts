import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getComplaintStats } from "@/lib/services/complaints";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { user: sessionUser, isDemo } = await getServerSessionUser(cookieStore);

    // Only authenticated users can access aggregated statistics
    if (!sessionUser) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const stats = await getComplaintStats({ isDemo });

    return NextResponse.json({
      ok: true,
      data: stats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
