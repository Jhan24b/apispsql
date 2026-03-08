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

// Preflight CORS handler
export async function OPTIONS(req: NextRequest) {
  return applyCors(req, new NextResponse(null, { status: 204 }));
}

// GET: Obtener todos los gastos
export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "BDproyect"."expense" ORDER BY created_at DESC`);
    return applyCors(req, NextResponse.json({ data: result.rows }));
  } catch (err) {
    return applyCors(req, NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 }));
  }
}

// POST: Crear un nuevo gasto
export async function POST(req: NextRequest) {
  try {
    const { amount, description, category, date } = await req.json();

    const result = await pool.query(
      `INSERT INTO "BDproyect"."expense" (amount, description, category, date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [amount, description, category, date]
    );

    return applyCors(req, NextResponse.json({ data: result.rows[0] }, { status: 201 }));
  } catch (err) {
    return applyCors(req, NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 }));
  }
}