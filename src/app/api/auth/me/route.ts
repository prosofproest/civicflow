import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSessionUser } from "@/lib/auth/server-session";

export async function GET(request: Request) {
  // Use request to ensure request-scoped execution
  void request;
  try {
    const cookieStore = await cookies();
    const { user, error } = await getServerSessionUser(cookieStore);

    if (!user) {
      return NextResponse.json(
        { user: null, error: error || "Session expired or invalid" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        isDemo: user.isDemo,
      },
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      ("digest" in error || (error instanceof Error && error.message.includes("prerender")))
    ) {
      throw error;
    }
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { user: null, error: "Failed to resolve session" },
      { status: 500 }
    );
  }
}
