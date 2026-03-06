import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { path, timestamp } = body;

    // Validación básica
    if (!path || !timestamp) {
      return NextResponse.json(
        { error: "Parámetros inválidos: se requiere 'path' y 'timestamp'" },
        { status: 400 }
      );
    }

    // Inserción directa en la base de datos
    const result = await pool.query(
      `INSERT INTO "BDproyect"."base" (path, timestamp)
       VALUES ($1, $2)
       RETURNING *;`,
      [path, timestamp]
    );

    return NextResponse.json(
      {
        message: "Log guardado exitosamente",
        id: result.rows[0].id
      },
      { status: 201 }
    );

  } catch (err) {
    console.error("Error al procesar el log:", err);
    return NextResponse.json(
      { error: "Error interno al procesar la solicitud" },
      { status: 500 }
    );
  }
}
