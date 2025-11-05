import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { driver_id, seq } = await req.json();

    const result = await pool.query(
      `INSERT INTO "BDproyect"."travel" (driver_id, seq, started_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')
      RETURNING *;
      `,
      [driver_id, seq]
    );

    return NextResponse.json({ route: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
//hola
