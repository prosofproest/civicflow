import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionSchema } from "@/lib/validation/auth";
import { getAdminAuth, getOrCreateUserProfile } from "@/lib/firebase/admin";

const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  try {
    const body = await req.json();
    const parsed = sessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { idToken } = parsed.data;
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { error: "Authentication service is currently unavailable" },
        { status: 503 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (verifyError: unknown) {
      console.error("ID Token verification failed:", verifyError);
      return NextResponse.json(
        { error: "Invalid or expired Firebase ID token" },
        { status: 401 }
      );
    }

    const { uid, email, name } = decodedToken;
    if (!email) {
      return NextResponse.json(
        { error: "User account must have an associated email address" },
        { status: 400 }
      );
    }

    // Retrieve or create trusted user profile in Firestore
    // Note: getOrCreateUserProfile strictly assigns 'citizen' role to new users
    const user = await getOrCreateUserProfile(uid, email, name);

    // Reject deactivated accounts
    if (!user.active) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact municipal support." },
        { status: 403 }
      );
    }

    let sessionCookie = idToken;
    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_DURATION_MS,
      });
    } catch (cookieError) {
      console.warn("createSessionCookie fallback to idToken:", cookieError);
      sessionCookie = idToken;
    }

    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("civicflow_session", sessionCookie, {
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
    });

    cookieStore.set("civicflow_role", user.role, {
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication session establishment" },
      { status: 500 }
    );
  }
}
