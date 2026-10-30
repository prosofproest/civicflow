/**
 * CivicFlow Cloudinary Signature & Verification Service
 * 
 * Provides server-generated upload signatures for secure client-to-Cloudinary image uploads.
 * Ensures the Cloudinary API secret is never exposed to the client bundle.
 */

import crypto from "node:crypto";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  isConfigured: boolean;
}

export interface CloudinarySignatureResult {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinaryClientConfig(): CloudinaryConfig {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  return {
    cloudName,
    apiKey,
    isConfigured: isCloudinaryConfigured(),
  };
}

/**
 * Generates a cryptographic upload signature for Cloudinary.
 */
export function generateCloudinarySignature(folder = "civicflow_reports"): CloudinarySignatureResult | null {
  if (!isCloudinaryConfigured()) {
    return null;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.round(Date.now() / 1000);

  // Cloudinary signature convention: parameters sorted alphabetically
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  return {
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder,
  };
}
