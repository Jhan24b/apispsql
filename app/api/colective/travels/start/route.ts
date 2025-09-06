import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { driverId, routeName } = await req.json();

    const result = await pool.query(
      `INSERT INTO "BDproyect"."travel" (driver_id, seq)
       VALUES ($1, $2) RETURNING *`,
      [driverId, routeName]
    );

    return NextResponse.json({ route: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
