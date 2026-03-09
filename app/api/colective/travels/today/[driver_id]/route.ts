import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const allowedOrigins = [
  "http://localhost:3000",
  "https://colectivedriver.vercel.app"
];

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  return new NextResponse(null, { status: 200 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ driver_id: string }> }
) {
  try {
    const { driver_id } = await params;
    const driverId = parseInt(driver_id);

    if (isNaN(driverId)) {
      return NextResponse.json(
        { error: "driver_id inválido" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM "BDproyect"."travel"
      WHERE driver_id = $1
        AND completed = true
        AND started_at::date = CURRENT_DATE
      `,
      [driverId]
    );

    const count = parseInt(result.rows[0]?.count || "0");

    return NextResponse.json({ count });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
