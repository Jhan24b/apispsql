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
      "POST, GET, OPTIONS"
    );
  }

  return res;
}

export async function OPTIONS(req: NextRequest) {
  return applyCors(req, new NextResponse(null, { status: 204 }));
}

// POST /api/routes
export async function POST(req: NextRequest) {
  try {
    const { name, companyId } = await req.json();

    const result = await pool.query(
      `INSERT INTO "BDproyect"."route" (name, company_id)
       VALUES ($1, $2) RETURNING *`,
      [name, companyId]
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

// GET /api/routes
export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT * FROM "BDproyect"."route" ORDER BY id`
    );
    return applyCors(req, NextResponse.json({ routes: result.rows }));
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
