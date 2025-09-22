import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { travel_id } = await req.json();

    const result = await pool.query(
      `UPDATE "BDproyect"."travel"
       SET end_time = CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima',
           duration = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima') - started_at,
           completed = true
       WHERE id = $1
       RETURNING *`,
      [travel_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "No se encontró la ruta con ese ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ route: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
