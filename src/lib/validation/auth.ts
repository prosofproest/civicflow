import { z } from "zod";

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must not exceed 50 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const sessionSchema = z.object({
  idToken: z
    .string()
    .min(10, "Valid Firebase ID token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
