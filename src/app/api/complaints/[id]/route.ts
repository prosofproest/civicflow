import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getComplaintById, updateComplaint, getStatusEvents } from "@/lib/services/complaints";
import { Status } from "@/types";
import { STATUSES } from "@/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { user: sessionUser, isDemo } = await getServerSessionUser(cookieStore);

    const complaint = await getComplaintById(id, { isDemo });

    if (!complaint) {
      return NextResponse.json(
        { ok: false, error: "Complaint not found" },
        { status: 404 }
      );
    }

    // Citizens can only view their own complaint
    if (sessionUser && sessionUser.role === "citizen" && complaint.reporterUid !== sessionUser.uid) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: You do not have permission to view this complaint" },
        { status: 403 }
      );
    }

    const events = await getStatusEvents(id, { isDemo });

    return NextResponse.json({
      ok: true,
      data: {
        complaint,
        events,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { user: sessionUser, isDemo } = await getServerSessionUser(cookieStore);

    if (!sessionUser) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Role Enforcement: Only officers and admins can update ticket status or assign
    if (sessionUser.role !== "officer" && sessionUser.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: Only officers and municipal administrators can update complaints" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;
    const assignedTo = body.assignedTo ?? body.assignedOfficer;
    const note = body.note ?? body.resolutionNotes;

    if (status && !STATUSES.includes(status as Status)) {
      return NextResponse.json(
        { ok: false, error: `Invalid status. Must be one of: ${STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await updateComplaint(
      id,
      {
        status: status as Status | undefined,
        assignedTo: typeof assignedTo === "string" ? assignedTo.trim() : undefined,
        note: typeof note === "string" ? note.trim() : undefined,
      },
      {
        uid: sessionUser.uid,
        role: sessionUser.role,
      },
      { isDemo }
    );

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
