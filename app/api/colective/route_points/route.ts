import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/route-points
export async function POST(req: NextRequest) {
  try {
    const { lat, lng, orden, routeId, tipo } = await req.json();

    const result = await pool.query(
      `INSERT INTO "BDproyect"."route_points" (lat, lng, orden, route_id, tipo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [lat, lng, orden, routeId, tipo]
    );

    return NextResponse.json({ point: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
