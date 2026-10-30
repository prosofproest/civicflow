import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type Auth,
  type UserCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== "undefined" || isFirebaseConfigured()) {
  try {
    if (firebaseConfig.apiKey) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
    }
  } catch (error) {
    console.error("Failed to initialize Firebase client:", error);
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { app, auth };

export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<{ userCredential: UserCredential; idToken: string }> {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Please supply NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  const idToken = await userCredential.user.getIdToken();
  return { userCredential, idToken };
}

export async function signInWithEmail(
  email: string,
  pass: string
): Promise<{ userCredential: UserCredential; idToken: string }> {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Please supply NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const idToken = await userCredential.user.getIdToken();
  return { userCredential, idToken };
}

export async function signInWithGoogle(): Promise<{
  userCredential: UserCredential;
  idToken: string;
}> {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Please supply NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
  const userCredential = await signInWithPopup(auth, googleProvider);
  const idToken = await userCredential.user.getIdToken();
  return { userCredential, idToken };
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Please supply NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
  await sendPasswordResetEmail(auth, email);
}
