import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/route-points/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { lat, lng, orden, tipo } = await req.json();
    const { id } = await params;
    const result = await pool.query(
      `UPDATE "BDproyect"."route_points"
       SET lat = $1, lng = $2, orden = $3, tipo = $4
       WHERE id = $5
       RETURNING *`,
      [lat, lng, orden, tipo, id]
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT * FROM "BDproyect"."route_points"
       WHERE route_id = $1
       ORDER BY orden ASC`,
      [id]
    );
    return NextResponse.json(result.rows);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await pool.query(`DELETE FROM "BDproyect"."route_points" WHERE id = $1`, [
      id
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
