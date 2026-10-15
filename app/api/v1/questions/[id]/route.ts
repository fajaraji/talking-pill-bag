import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  done: z.boolean(),
});

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    const body = (await request.json()) as unknown;
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const rows = await sql`
      UPDATE questions
      SET done = ${parsed.data.done}
      WHERE id = ${id} AND household_id = ${auth.householdId}
      RETURNING id, kind, medicine_id, drug_name, text, to_char(asked_on, 'YYYY-MM-DD') AS asked_on, done
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ question: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[questions/id] PUT error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;

    const rows = await sql`
      DELETE FROM questions
      WHERE id = ${id} AND household_id = ${auth.householdId}
      RETURNING id
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[questions/id] DELETE error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
