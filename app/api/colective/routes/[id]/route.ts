import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "https://colectivedriver.vercel.app"
];

function applyCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, PUT, DELETE, OPTIONS"
    );
  }

  return res;
}

export async function OPTIONS(req: NextRequest) {
  return applyCors(req, new NextResponse(null, { status: 204 }));
}

// GET /api/routes/[id]/full
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT r.*
      FROM "BDproyect"."route" r
      WHERE r.company_id = $1
      ORDER BY r.id;`,
      [id]
    );

    return applyCors(req, NextResponse.json(result.rows));
  } catch (err) {
    return applyCors(
      req,
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Error" },
        { status: 500 }
      )
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
    return applyCors(req, NextResponse.json({ route: result.rows[0] }));
  } catch (err) {
    return applyCors(
      req,
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Error" },
        { status: 500 }
      )
    );
  }
}

// DELETE /api/routes/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM "BDproyect"."route" WHERE id = $1`, [id]);
    return applyCors(req, NextResponse.json({ success: true }));
  } catch (err) {
    return applyCors(
      req,
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Error" },
        { status: 500 }
      )
    );
  }
}
