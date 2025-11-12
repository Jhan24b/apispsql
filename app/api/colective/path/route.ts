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
