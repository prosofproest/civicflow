import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { createComplaintSchema } from "@/lib/validation/complaint";
import { createComplaint } from "@/lib/services/complaints";

const confirmedSubmissionSchema = createComplaintSchema.extend({
  explicitlyConfirmed: z.literal(true, {
    message: "Submission must be explicitly confirmed by the citizen",
  }),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { user, error: authError } = await getServerSessionUser(cookieStore);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: authError || "Authentication required to submit complaints" },
        { status: 401 }
      );
    }

    const rawBody = await request.json();
    const validation = confirmedSubmissionSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid complaint submission confirmation",
          issues: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Execute through the official complaint pipeline
    const complaint = await createComplaint(
      {
        text: validation.data.text,
        category: validation.data.category,
        location: validation.data.location,
        imageUrl: validation.data.imageUrl,
      },
      user.uid
    );

    return NextResponse.json({
      ok: true,
      data: complaint,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute confirmed complaint submission";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
