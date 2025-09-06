import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/routes/[id]/full
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      [id]
    );

    return NextResponse.json({ route: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// PUT /api/routes/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, companyId } = await req.json();
    const result = await pool.query(
      `UPDATE "BDproyect"."route"
       SET name = $1, company_id = $2
       WHERE id = $3
       RETURNING *`,
      [name, companyId, id]
    );
    return NextResponse.json({ route: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/routes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM "BDproyect"."route" WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
