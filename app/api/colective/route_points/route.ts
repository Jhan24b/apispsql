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

// GET /api/routes/[id]/points
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      `SELECT * FROM "BDproyect"."route_points"
       WHERE route_id = $1
       ORDER BY orden ASC`,
      [params.id]
    );
    return NextResponse.json({ points: result.rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// PUT /api/route-points/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { lat, lng, orden, tipo } = await req.json();
    const result = await pool.query(
      `UPDATE "BDproyect"."route_points"
       SET lat = $1, lng = $2, orden = $3, tipo = $4
       WHERE id = $5
       RETURNING *`,
      [lat, lng, orden, tipo, params.id]
    );
    return NextResponse.json({ point: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/route-points/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await pool.query(`DELETE FROM "BDproyect"."route_points" WHERE id = $1`, [
      params.id,
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
