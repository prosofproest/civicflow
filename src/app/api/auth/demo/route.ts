import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Role, User } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const role = body.role;
    const validRole: Role =
      role === "admin" ? "admin" : role === "officer" ? "officer" : "citizen";
    const cookieStore = await cookies();

    const isProduction = process.env.NODE_ENV === "production";

    // 1. Maintain or initialize persistent demo session identifier
    let demoSessionId = cookieStore.get("civicflow_demo_session")?.value;
    if (!demoSessionId || !demoSessionId.startsWith("demo_sess_")) {
      demoSessionId = `demo_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    const cookieOptions = {
      maxAge: 86400 * 7, // 7 days persistent demo session
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax" as const,
    };

    // 2. Centralized demo session cookies
    cookieStore.set("civicflow_mode", "demo", cookieOptions);
    cookieStore.set("civicflow_demo_session", demoSessionId, cookieOptions);
    cookieStore.set("civicflow_demo_role", validRole, cookieOptions);

    // Standard session cookies for middleware / proxy backward-compatibility
    cookieStore.set("civicflow_session", `demo_token_${demoSessionId}`, cookieOptions);
    cookieStore.set("civicflow_role", validRole, cookieOptions);

    const displayName =
      validRole === "admin"
        ? "Demo Administrator"
        : validRole === "officer"
        ? "Demo Officer"
        : "Demo Citizen";

    const user: User = {
      uid: validRole === "citizen" ? "demo_citizen_uid_123" : `demo_${validRole}_uid_123`,
      email: `${validRole}@civicflow.local`,
      displayName,
      role: validRole,
      active: true,
      createdAt: new Date().toISOString(),
      isDemo: true,
    };

    return NextResponse.json({
      ok: true,
      mode: "demo",
      demoRole: validRole,
      demoSessionId,
      user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to set demo session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
