import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const role = body.role;
    const validRole = role === "admin" ? "admin" : role === "officer" ? "officer" : "citizen";
    const cookieStore = await cookies();

    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("civicflow_session", "demo_token", {
      maxAge: 86400,
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
    });

    cookieStore.set("civicflow_role", validRole, {
      maxAge: 86400,
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({
      ok: true,
      user: {
        uid: `demo_${validRole}_uid_123`,
        email: `${validRole}@civicflow.local`,
        displayName: `Demo ${validRole.charAt(0).toUpperCase() + validRole.slice(1)}`,
        role: validRole,
        active: true,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to set demo session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
