import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <- sin Promise
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT * FROM "frescos".vendors WHERE id = $1 ORDER BY id ASC`,
      [id]
    );

    return NextResponse.json(result.rows);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
