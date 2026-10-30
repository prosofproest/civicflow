import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { generateCloudinarySignature, isCloudinaryConfigured } from "@/lib/cloudinary/server";

export async function GET() {
  const cookieStore = await cookies();
  const { user } = await getServerSessionUser(cookieStore);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required to upload media" },
      { status: 401 }
    );
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      message: "Cloudinary is not configured. Text-only submission is active.",
    });
  }

  const signatureData = generateCloudinarySignature("civicflow_reports");
  if (!signatureData) {
    return NextResponse.json(
      { ok: false, error: "Failed to generate Cloudinary signature" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    ...signatureData,
  });
}
