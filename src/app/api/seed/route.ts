import { NextResponse } from "next/server";
import { seedSyntheticDataset } from "@/lib/services/complaints";

export async function POST() {
  try {
    const result = await seedSyntheticDataset();
    return NextResponse.json({
      ok: true,
      message: `Successfully seeded ${result.seededCount} synthetic civic reports (${result.isFirestore ? "Firestore Cloud" : "Local Demo Store"}).`,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to seed demo dataset";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
