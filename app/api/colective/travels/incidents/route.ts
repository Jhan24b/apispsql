import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { travelId, ubication, duration } = await req.json();

    const result = await pool.query(
      `INSERT INTO "BDproyect"."incidents" (travel_id, ubication, duration)
       VALUES ($1, $2, $3) RETURNING *`,
      [travelId, ubication, duration]
    );

    return NextResponse.json({ incident: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
