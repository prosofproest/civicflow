import { NextResponse } from "next/server";
import { priorityInputSchema } from "@/lib/validation/engine";
import { calculatePriority } from "@/lib/engine/priority";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = priorityInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid priority calculation input",
          issues: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const result = calculatePriority(validation.data);

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate priority";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
