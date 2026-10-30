import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { createComplaintSchema, complaintQuerySchema } from "@/lib/validation/complaint";
import { createComplaint, getComplaints } from "@/lib/services/complaints";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const { user, isDemo, error: authError } = await getServerSessionUser(cookieStore);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: authError || "Authentication required to submit complaints" },
      { status: 401 }
    );
  }

  try {
    const rawBody = await request.json();
    const validation = createComplaintSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid complaint submission",
          issues: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Always enforce reporterUid from verified server session
    const complaint = await createComplaint(validation.data, user.uid, { isDemo });

    return NextResponse.json({
      ok: true,
      data: complaint,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process complaint";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const { user, isDemo } = await getServerSessionUser(cookieStore);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required to view complaints" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const queryValidation = complaintQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    const queryData = queryValidation.success
      ? queryValidation.data
      : { limit: 50, reporterOnly: undefined, category: undefined, status: undefined, priority: undefined };

    // Strict Privacy: Citizens are always restricted to their own submitted reports
    const reporterUid =
      user.role === "citizen" || queryData.reporterOnly === "true"
        ? user.uid
        : undefined;

    const complaints = await getComplaints({
      reporterUid,
      category: queryData.category,
      status: queryData.status,
      limit: queryData.limit || 50,
      isDemo,
    });

    return NextResponse.json({
      ok: true,
      data: complaints,
      count: complaints.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch complaints";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
