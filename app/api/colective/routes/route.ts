import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/routes
export async function POST(req: NextRequest) {
  try {
    const { name, companyId } = await req.json();

    const result = await pool.query(
      `INSERT INTO "BDproyect"."route" (name, company_id)
       VALUES ($1, $2) RETURNING *`,
      [name, companyId]
    );

    return NextResponse.json({ route: result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// GET /api/routes
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT * FROM "BDproyect"."route" ORDER BY id`
    );
    return NextResponse.json({ routes: result.rows });
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
  { params }: { params: { id: string } }
) {
  try {
    const { name, companyId } = await req.json();
    const result = await pool.query(
      `UPDATE "BDproyect"."route"
       SET name = $1, company_id = $2
       WHERE id = $3
       RETURNING *`,
      [name, companyId, params.id]
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
  { params }: { params: { id: string } }
) {
  try {
    await pool.query(`DELETE FROM "BDproyect"."route" WHERE id = $1`, [
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
