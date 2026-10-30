import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  try {
    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("civicflow_session", "", {
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      expires: new Date(0),
    });

    cookieStore.set("civicflow_role", "", {
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      expires: new Date(0),
    });

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to clear session cookies" },
      { status: 500 }
    );
  }
}
