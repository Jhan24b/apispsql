import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { coords } = body;

    // Validación de parámetros
    if (!Array.isArray(coords) || coords.length === 0) {
      return NextResponse.json(
        { error: "Parámetros inválidos: falta coords[]" },
        { status: 400 }
      );
    }

    // Validar que cada coordenada tenga los campos requeridos
    for (const coord of coords) {
      if (
        typeof coord.latitude !== "number" ||
        typeof coord.longitude !== "number" ||
        typeof coord.timestamp !== "string"
      ) {
        return NextResponse.json(
          {
            error:
              "Cada coordenada debe tener latitude (number), longitude (number) y timestamp (string)"
          },
          { status: 400 }
        );
      }
    }

    // Insertar cada coordenada individualmente
    const insertedRecords = [];

    for (const coord of coords as Coordinate[]) {
      const result = await pool.query(
        `INSERT INTO "BDproyect"."check" (latitude, longitude, timestamp)
         VALUES ($1, $2, $3)
         RETURNING *;`,
        [coord.latitude, coord.longitude, coord.timestamp]
      );

      if (result.rows.length > 0) {
        insertedRecords.push(result.rows[0]);
      }
    }

    if (insertedRecords.length === 0) {
      return NextResponse.json(
        { error: "No se pudo insertar ningún registro" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: `${insertedRecords.length} coordenadas insertadas exitosamente`,
        records: insertedRecords
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error al procesar la solicitud:", err);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
