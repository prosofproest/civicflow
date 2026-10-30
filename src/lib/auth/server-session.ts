/**
 * CivicFlow Server-Side Authenticated Session Helper
 * 
 * Verifies session cookies via Firebase Admin SDK.
 * Returns the trusted user profile and UID, preventing client-side spoofing.
 */

import { getAdminAuth, getUserProfile, getOrCreateUserProfile, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { User, Role } from "@/types";

export interface CookieStoreLike {
  get(name: string): { value: string } | undefined;
}

export interface ServerSessionResult {
  user: User | null;
  error?: string;
  isDemo?: boolean;
}

export async function getServerSessionUser(
  cookieStore: CookieStoreLike
): Promise<ServerSessionResult> {
  const sessionCookie = cookieStore.get("civicflow_session")?.value;
  const roleCookie = cookieStore.get("civicflow_role")?.value;
  const modeCookie = cookieStore.get("civicflow_mode")?.value;
  const demoRoleCookie = cookieStore.get("civicflow_demo_role")?.value;

  // 1. Check for isolated demo mode session
  const isDemo =
    modeCookie === "demo" ||
    Boolean(demoRoleCookie) ||
    sessionCookie?.startsWith("demo_") === true ||
    sessionCookie === "demo_token";

  if (isDemo) {
    const rawRole = demoRoleCookie || roleCookie;
    const role: Role =
      rawRole === "admin" ? "admin" : rawRole === "officer" ? "officer" : "citizen";

    const displayName =
      role === "admin"
        ? "Demo Administrator"
        : role === "officer"
        ? "Demo Officer"
        : "Demo Citizen";

    return {
      isDemo: true,
      user: {
        uid: role === "citizen" ? "demo_citizen_uid_123" : `demo_${role}_uid_123`,
        email: `${role}@civicflow.local`,
        displayName,
        role,
        active: true,
        createdAt: new Date().toISOString(),
        isDemo: true,
      },
    };
  }

  // 2. Real Production Firebase Authentication Session
  if (!sessionCookie) {
    return { user: null, error: "Authentication session required", isDemo: false };
  }

  if (!isFirebaseAdminConfigured()) {
    return { user: null, error: "Authentication service unavailable", isDemo: false };
  }

  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return { user: null, error: "Authentication service unavailable", isDemo: false };
    }
    let uid: string | null = null;

    try {
      const decodedSession = await adminAuth.verifySessionCookie(sessionCookie, false);
      uid = decodedSession.uid;
    } catch {
      try {
        const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        uid = decodedToken.uid;
      } catch {
        return { user: null, error: "Session token invalid or expired", isDemo: false };
      }
    }

    if (!uid) {
      return { user: null, error: "Unable to extract user identity", isDemo: false };
    }

    let user = await getUserProfile(uid);
    if (!user) {
      try {
        const fbUser = await adminAuth.getUser(uid);
        if (fbUser && fbUser.email) {
          user = await getOrCreateUserProfile(
            uid,
            fbUser.email,
            fbUser.displayName || undefined
          );
        }
      } catch (authErr) {
        console.warn("Firebase Auth fallback lookup failed for uid:", uid, authErr);
      }
    }

    if (!user || !user.active) {
      return { user: null, error: "Account profile inactive or missing", isDemo: false };
    }

    // STRICT PRODUCTION RBAC:
    // Real user profile and role are strictly derived from verified Firestore.
    // Client-provided roleCookie/demoRoleCookie is completely ignored.
    return {
      isDemo: false,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        isDemo: false,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failure";
    return { user: null, error: message, isDemo: false };
  }
}
