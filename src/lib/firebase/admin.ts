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

function getAdminApp(): App {
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
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    // Fallback initialize for environments with Google ADC or graceful build fallback
    adminApp = initializeApp({
      projectId: projectId || "civicflow-local",
    });
  }

  return adminApp;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const app = getAdminApp();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    const app = getAdminApp();
    adminDb = getFirestore(app);
  }
  return adminDb;
}

/**
 * Retrieves a user profile by UID from trusted Firestore.
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  const db = getAdminDb();
  const docRef = db.collection("users").doc(uid);
  const snap = await docRef.get();

  if (!snap.exists) {
    return null;
  }

  return snap.data() as User;
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
  const db = getAdminDb();
  const docRef = db.collection("users").doc(uid);
  const snap = await docRef.get();

  if (snap.exists) {
    const existing = snap.data() as User;
    return existing;
  }

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

  await docRef.set(newUser);
  return newUser;
}
