import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "https://colectivedriver.vercel.app",
];

// Helper para configurar CORS
function applyCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  }
  return res;
}

// GET: Obtener un gasto específico por ID
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT * FROM "BDproyect"."expense" WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return applyCors(req, NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 }));
    }

    return applyCors(req, NextResponse.json({ data: result.rows[0] }));
  } catch (err) {
    return applyCors(req, NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 }));
  }
}

// PUT / PATCH: Actualizar un gasto
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { amount, description, category, date } = await req.json();

    const result = await pool.query(
      `UPDATE "BDproyect"."expense" 
       SET amount = $1, description = $2, category = $3, date = $4
       WHERE id = $5 RETURNING *`,
      [amount, description, category, date, id]
    );

    if (result.rows.length === 0) {
      return applyCors(req, NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 }));
    }

    return applyCors(req, NextResponse.json({ data: result.rows[0] }));
  } catch (err) {
    return applyCors(req, NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 }));
  }
}

// DELETE: Eliminar un gasto
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      `DELETE FROM "BDproyect"."expense" WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return applyCors(req, NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 }));
    }

    return applyCors(req, NextResponse.json({ message: "Gasto eliminado correctamente" }));
  } catch (err) {
    return applyCors(req, NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 }));
  }
}
