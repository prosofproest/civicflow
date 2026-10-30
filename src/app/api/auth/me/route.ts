import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth, getUserProfile } from "@/lib/firebase/admin";

export async function GET() {
  const cookieStore = await cookies();
  try {
    const sessionCookie = cookieStore.get("civicflow_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    let uid: string | null = null;

    try {
      const decodedSession = await adminAuth.verifySessionCookie(
        sessionCookie,
        true
      );
      uid = decodedSession.uid;
    } catch {
      try {
        const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        uid = decodedToken.uid;
      } catch {
        return NextResponse.json(
          { user: null, error: "Session expired or invalid" },
          { status: 401 }
        );
      }
    }

    if (!uid) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await getUserProfile(uid);

    if (!user || !user.active) {
      return NextResponse.json(
        { user: null, error: "User profile not found or deactivated" },
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
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { user: null, error: "Failed to resolve session" },
      { status: 500 }
    );
  }
}
