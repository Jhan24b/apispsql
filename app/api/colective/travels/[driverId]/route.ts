import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const driverId = await params;

    const result = await pool.query(
      `SELECT rl.*, 
              json_agg(i.*) AS incidents
       FROM "BDproyect"."travel" rl
       LEFT JOIN "BDproyect"."incidents" i ON i.route_id = rl.id
       WHERE rl.driver_id = $1
       GROUP BY rl.id
       ORDER BY rl.start_time DESC`,
      [driverId]
    );

    return NextResponse.json({ routes: result.rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
