import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { driverId, desvio, coords } = await req.json();

    if (!driverId || !Array.isArray(coords) || coords.length === 0) {
      return NextResponse.json(
        { error: "Parámetros inválidos: falta driverId o coords[]" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO "BDproyect"."path" (driver_id, desvio, coordinates)
       VALUES ($1, $2, $3)
       RETURNING *;`,
      [driverId, desvio, coords]
    );

    return NextResponse.json({ result: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
