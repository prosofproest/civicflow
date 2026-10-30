import { NextResponse } from "next/server";
import { hotspotInputSchema } from "@/lib/validation/engine";
import { detectHotspots } from "@/lib/engine/hotspot";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = hotspotInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid hotspot clustering input",
          issues: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { reports } = validation.data;
    const result = detectHotspots(reports);

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to compute hotspot clusters";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
