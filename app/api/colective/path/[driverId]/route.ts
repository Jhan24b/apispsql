import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { driverId, desvio, coords } = body;

    if (!driverId || !Array.isArray(coords) || coords.length === 0) {
      return NextResponse.json(
        { error: "Parámetros inválidos: falta driverId o coords[]" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO "BDproyect"."path" (driverId, desvio, coords)
       VALUES ($1, $2, $3)
       RETURNING *;`,
      [driverId, desvio, coords]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No se pudo insertar el registro" },
        { status: 400 }
      );
    }

    return NextResponse.json({ result: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get("driverId");

    if (!driverId) {
      return NextResponse.json(
        { error: "Parámetro 'driverId' requerido" },
        { status: 400 }
      );
    }

    const query = `
      SELECT
        d.id AS driver_id,
        u.name AS driver_name,
        r.name AS route_name,
        p.desvio,
        p.coordinates,
        p.created_at
      FROM "BDproyect"."path" p
      JOIN "BDproyect"."drivers" d ON p.driver_id = d.id
      JOIN "BDproyect"."route" r ON d.route_id = r.id
      JOIN "BDproyect"."users" u ON d.user_id = u.id
      WHERE p.driver_id = $1
        AND p.created_at >= NOW() - INTERVAL '1 day'
      ORDER BY p.created_at DESC
      LIMIT 1;
    `;

    const result = await pool.query(query, [driverId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "No se encontraron registros recientes para este conductor"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al obtener la información del conductor" },
      { status: 500 }
    );
  }
}
