import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  try {
    const isProduction = process.env.NODE_ENV === "production";

    const clearOptions = {
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax" as const,
      expires: new Date(0),
    };

    cookieStore.set("civicflow_session", "", clearOptions);
    cookieStore.set("civicflow_role", "", clearOptions);
    cookieStore.set("civicflow_mode", "", clearOptions);
    cookieStore.set("civicflow_demo_session", "", clearOptions);
    cookieStore.set("civicflow_demo_role", "", clearOptions);

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to clear session cookies" },
      { status: 500 }
    );
  }
}
