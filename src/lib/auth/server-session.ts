/**
 * CivicFlow Server-Side Authenticated Session Helper
 * 
 * Verifies session cookies via Firebase Admin SDK.
 * Returns the trusted user profile and UID, preventing client-side spoofing.
 */

import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { getAdminAuth, getUserProfile, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { User } from "@/types";

export interface ServerSessionResult {
  user: User | null;
  error?: string;
}

export async function getServerSessionUser(
  cookieStore: ReadonlyRequestCookies
): Promise<ServerSessionResult> {
  const sessionCookie = cookieStore.get("civicflow_session")?.value;
  const roleCookie = cookieStore.get("civicflow_role")?.value;

  if (!sessionCookie) {
    // If Firebase Admin is not configured, provide a local mock session for demo mode
    if (!isFirebaseAdminConfigured() && roleCookie) {
      return {
        user: {
          uid: "demo_citizen_uid_123",
          email: "citizen@civicflow.local",
          displayName: "Demo Citizen",
          role: roleCookie === "admin" ? "admin" : roleCookie === "officer" ? "officer" : "citizen",
          active: true,
          createdAt: new Date().toISOString(),
        },
      };
    }
    return { user: null, error: "Authentication session required" };
  }

  if (!isFirebaseAdminConfigured()) {
    // Graceful unconfigured demo mode
    return {
      user: {
        uid: "demo_citizen_uid_123",
        email: "citizen@civicflow.local",
        displayName: "Demo Citizen",
        role: "citizen",
        active: true,
        createdAt: new Date().toISOString(),
      },
    };
  }

  try {
    const adminAuth = getAdminAuth();
    let uid: string | null = null;

    try {
      const decodedSession = await adminAuth.verifySessionCookie(sessionCookie, true);
      uid = decodedSession.uid;
    } catch {
      try {
        const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        uid = decodedToken.uid;
      } catch {
        return { user: null, error: "Session token invalid or expired" };
      }
    }

    if (!uid) {
      return { user: null, error: "Unable to extract user identity" };
    }

    const user = await getUserProfile(uid);
    if (!user || !user.active) {
      return { user: null, error: "Account profile inactive or missing" };
    }

    return { user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failure";
    return { user: null, error: message };
  }
}
