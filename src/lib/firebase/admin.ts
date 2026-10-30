import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { User, Role } from "@/types";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

export function isAdminConfigured(): boolean {
  return Boolean(
    (process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL) ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

export const isFirebaseAdminConfigured = isAdminConfigured;

function getAdminApp(): App | null {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (privateKey) {
    // Handle escaped newlines in environment variable
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (clientEmail && privateKey) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      return adminApp;
    } catch (err) {
      console.warn("Failed to initialize Firebase Admin with credentials:", err);
    }
  }

  try {
    // Fallback initialize for environments with Google ADC or graceful build fallback
    adminApp = initializeApp({
      projectId: projectId || "civicflow-local",
    });
    return adminApp;
  } catch (err) {
    console.warn("Fallback initializeApp failed:", err);
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  try {
    if (!adminAuth) {
      const app = getAdminApp();
      if (!app) return null;
      adminAuth = getAuth(app);
    }
    return adminAuth;
  } catch (err) {
    console.warn("getAdminAuth unavailable:", err);
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  try {
    if (!adminDb) {
      const app = getAdminApp();
      if (!app) return null;
      adminDb = getFirestore(app);
      adminDb.settings({ ignoreUndefinedProperties: true });
    }
    return adminDb;
  } catch (err) {
    console.warn("getAdminDb unavailable:", err);
    return null;
  }
}

export const getAdminFirestore = getAdminDb;

/**
 * Retrieves a user profile by UID from trusted Firestore.
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  const db = getAdminDb();
  if (!db) return null;

  try {
    const docRef = db.collection("users").doc(uid);
    const snap = await docRef.get();

    if (!snap.exists) {
      return null;
    }

    return snap.data() as User;
  } catch (err) {
    console.warn("Firestore getUserProfile failed:", err);
    return null;
  }
}

/**
 * Gets or creates a trusted user profile in Firestore.
 * CRITICAL RULE: New registrations and first-time Google sign-ins
 * ALWAYS receive the 'citizen' role.
 * Role can never be set by the client.
 */
export async function getOrCreateUserProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const resolvedDisplayName =
    displayName?.trim() || cleanEmail.split("@")[0] || "Citizen";

  const newUser: User = {
    uid,
    email: cleanEmail,
    displayName: resolvedDisplayName,
    role: "citizen" as Role, // STRICT ENFORCEMENT: citizen only
    active: true,
    createdAt: new Date().toISOString(),
  };

  const db = getAdminDb();
  if (!db) {
    return newUser;
  }

  try {
    const docRef = db.collection("users").doc(uid);
    const snap = await docRef.get();

    if (snap.exists) {
      return snap.data() as User;
    }

    await docRef.set(newUser);
    return newUser;
  } catch (err) {
    console.warn("getOrCreateUserProfile Firestore write failed:", err);
    return newUser;
  }
}
