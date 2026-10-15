import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireDevice } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateDeviceSchema = z.object({
  label: z.string().min(1).max(40),
});

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as unknown;
    const parsed = updateDeviceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const rows = await sql`
      UPDATE devices
      SET label = ${parsed.data.label}
      WHERE id = ${id} AND household_id = ${auth.householdId}
      RETURNING id, label
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ device: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[devices/id] PUT error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireDevice(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Prevent deleting yourself
    if (id === auth.deviceId) {
      return NextResponse.json(
        { error: "Cannot unlink your own device." },
        { status: 400 }
      );
    }

    const rows = await sql`
      DELETE FROM devices
      WHERE id = ${id} AND household_id = ${auth.householdId}
      RETURNING id
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[devices/id] DELETE error:", message);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
