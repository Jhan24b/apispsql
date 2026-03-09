import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "https://colectivedriver.vercel.app",
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

// GET: Obtener la ruta diaria del conductor
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const driverId = (await params).id;

    if (!driverId) {
      return applyCors(
        req,
        NextResponse.json({ error: "driverId is required in URL" }, { status: 400 })
      );
    }

    // Obtener la ruta elegida hoy directamente de la tabla drivers
    const result = await pool.query(
      `SELECT route_id FROM "BDproyect"."drivers" WHERE id = $1`,
      [driverId]
    );

    if (result.rows.length === 0) {
       return applyCors(
        req,
        NextResponse.json({ error: "Driver not found" }, { status: 404 })
      );
    }

    const assignedRoute = result.rows[0].route_id;

    if (!assignedRoute) {
      return applyCors(
        req,
        NextResponse.json({ routeId: null, assigned: false }, { status: 200 })
      );
    }

    return applyCors(
      req,
      NextResponse.json({ routeId: assignedRoute, assigned: true }, { status: 200 })
    );
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

// POST: Registrar la ruta diaria del conductor
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const driverId = (await params).id;
    const { routeId } = await req.json();

    if (!driverId || !routeId) {
      return applyCors(
        req,
        NextResponse.json({ error: "driverId (URL) and routeId (body) are required" }, { status: 400 })
      );
    }

    // Insertar la ruta actualizandola directamente en el conductor
    const result = await pool.query(
      `UPDATE "BDproyect"."drivers"
       SET route_id = $2
       WHERE id = $1 RETURNING *`,
      [driverId, routeId]
    );

    if (result.rows.length === 0) {
      return applyCors(
        req,
        NextResponse.json({ error: "No se encontró un conductor con ese ID" }, { status: 404 })
      );
    }

    return applyCors(
      req,
      NextResponse.json({ data: result.rows[0], assigned: true }, { status: 200 })
    );
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
