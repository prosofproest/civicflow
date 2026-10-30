import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { checkRateLimit } from "@/lib/assistant/rate-limiter";
import { processAssistantChat } from "@/lib/assistant/service";

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(3000),
    })
  ).min(1, "At least one message is required"),
  context: z.object({
    currentPath: z.string().optional(),
    selectedComplaintId: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { user: sessionUser } = await getServerSessionUser(cookieStore);

    // Rate limiting: by UID if logged in, or by IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous_client";

    const rateLimitIdentifier = sessionUser?.uid ? `user_${sessionUser.uid}` : `ip_${clientIp}`;
    const rateCheck = checkRateLimit(rateLimitIdentifier);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many requests. Please wait a few seconds before sending another message.",
          retryAfterMs: rateCheck.resetMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    // Parse & validate body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = chatRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid chat payload",
          issues: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await processAssistantChat(validation.data, sessionUser);

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal assistant error";
    console.error("Assistant chat route error:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
