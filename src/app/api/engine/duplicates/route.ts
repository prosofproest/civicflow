import { NextResponse } from "next/server";
import { duplicateCheckSchema } from "@/lib/validation/engine";
import { findDuplicateCandidate } from "@/lib/engine/duplicate";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = duplicateCheckSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid duplicate check input",
          issues: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { target, candidates } = validation.data;
    const result = findDuplicateCandidate(target, candidates);

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to perform duplicate check";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
