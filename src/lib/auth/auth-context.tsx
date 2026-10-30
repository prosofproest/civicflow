"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import {
  auth,
  isFirebaseConfigured,
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  sendPasswordReset,
} from "@/lib/firebase/client";
import type { User, Role } from "@/types";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  isConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  registerWithEmail: (
    email: string,
    pass: string,
    displayName: string
  ) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isFirebaseConfigured();

  const syncServerSession = useCallback(async (idToken: string): Promise<User> => {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to establish server session");
    }

    const data = await res.json();
    setUser(data.user);
    return data.user;
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    // Asynchronously resolve initial server session
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          setUser(data?.user || null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      });

    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          try {
            const token = await fbUser.getIdToken();
            await syncServerSession(token);
          } catch (err) {
            console.error("Auto session sync error:", err);
          }
        }
        if (isMounted) {
          setIsLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [syncServerSession]);

  const handleLoginWithEmail = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { idToken } = await signInWithEmail(email, pass);
      const appUser = await syncServerSession(idToken);
      return appUser;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterWithEmail = async (
    email: string,
    pass: string,
    displayName: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const { idToken } = await signUpWithEmail(email, pass, displayName);
      const appUser = await syncServerSession(idToken);
      return appUser;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithGoogle = async (): Promise<User> => {
    setIsLoading(true);
    try {
      const { idToken } = await signInWithGoogle();
      const appUser = await syncServerSession(idToken);
      return appUser;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOutUser();
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (email: string): Promise<void> => {
    await sendPasswordReset(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isLoading,
        isConfigured,
        loginWithEmail: handleLoginWithEmail,
        registerWithEmail: handleRegisterWithEmail,
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout,
        resetPassword: handleResetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
