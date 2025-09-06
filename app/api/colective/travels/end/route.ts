import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { routeId } = await req.json();

    const result = await pool.query(
      `UPDATE "BDproyect"."travel"
       SET end_time = now(),
           duration = now() - start_time,
           completed = true
       WHERE id = $1
       RETURNING *`,
      [routeId]
    );

    const route = result.rows[0];

    await pool.query(
      `INSERT INTO "BDproyect"."payments" (travel_id, amount)
       VALUES ($1, $2)`,
      [route.driver_id, 5]
    );

    return NextResponse.json({ route });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
