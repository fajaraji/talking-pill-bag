import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

const questionSchema = z.object({
  kind: z.enum(["redirected", "custom"]),
  medicineId: z.string().uuid().nullable().optional(),
  drugName: z.string().optional(),
  text: z.string().min(1),
  askedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as unknown;
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.medicineId) {
      const medRows = await sql`
        SELECT id FROM medicines
        WHERE id = ${data.medicineId} AND household_id = ${auth.householdId} AND deleted_at IS NULL
      `;
      if (!medRows[0]) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const rows = await sql`
      INSERT INTO questions (household_id, kind, medicine_id, drug_name, text, asked_on)
      VALUES (
        ${auth.householdId}, ${data.kind},
        ${data.medicineId ?? null}, ${data.drugName ?? null},
        ${data.text}, ${data.askedOn}
      )
      RETURNING *
    `;

    return NextResponse.json({ question: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[questions] error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
