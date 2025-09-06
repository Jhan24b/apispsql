import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/routes/[id]/full
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      `SELECT r.*, 
              json_agg(
                json_build_object(
                  'id', p.id,
                  'lat', p.lat,
                  'lng', p.lng,
                  'orden', p.orden,
                  'tipo', p.tipo
                ) ORDER BY p.orden
              ) AS points
       FROM "BDproyect"."route" r
       LEFT JOIN "BDproyect"."route_points" p ON r.id = p.route_id
       WHERE r.id = $1
       GROUP BY r.id`,
      [params.id]
    );

    return NextResponse.json({ route: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
