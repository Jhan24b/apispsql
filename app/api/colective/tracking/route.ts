import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface Coordinate {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  timestamp: string;
}

interface TrackingRequest {
  travelId: number;
  coords: Coordinate[];
  batchId: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: TrackingRequest = await req.json();
    const { travelId, coords, batchId } = body;

    if (
      !travelId ||
      !Array.isArray(coords) ||
      coords.length === 0 ||
      !batchId
    ) {
      return NextResponse.json(
        {
          error:
            "Parámetros inválidos: se requiere travelId, coords (array no vacío) y batchId"
        },
        { status: 400 }
      );
    }

    // Validar cada coordenada
    for (const coord of coords) {
      if (
        typeof coord.latitude !== "number" ||
        typeof coord.longitude !== "number" ||
        typeof coord.accuracy !== "number" ||
        typeof coord.speed !== "number" ||
        typeof coord.timestamp !== "string"
      ) {
        return NextResponse.json(
          {
            error:
              "Cada coordenada debe tener latitude, longitude, accuracy, speed (números) y timestamp (string)"
          },
          { status: 400 }
        );
      }
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Verificar si el batchId ya fue procesado
      const existingBatch = await client.query(
        `SELECT id FROM "BDproyect"."tracking_batches" WHERE batch_id = $1`,
        [batchId]
      );

      if (existingBatch.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            success: true,
            message: "Batch ya procesado anteriormente",
            batchId
          },
          { status: 200 }
        );
      }

      // Crear tablas si no existen
      await client.query(`
        CREATE TABLE IF NOT EXISTS "BDproyect"."tracking" (
          id SERIAL PRIMARY KEY,
          "travelId" INTEGER NOT NULL,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          accuracy DOUBLE PRECISION,
          speed DOUBLE PRECISION,
          timestamp TIMESTAMP NOT NULL,
          recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "BDproyect"."tracking_batches" (
          id SERIAL PRIMARY KEY,
          batch_id VARCHAR(255) UNIQUE NOT NULL,
          travel_id INTEGER NOT NULL,
          points_count INTEGER NOT NULL,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Insertar cada coordenada
      for (const coord of coords) {
        await client.query(
          `INSERT INTO "BDproyect"."tracking" 
           ("travelId", latitude, longitude, accuracy, speed, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            travelId,
            coord.latitude,
            coord.longitude,
            coord.accuracy,
            coord.speed,
            coord.timestamp
          ]
        );
      }

      // Registrar el batch
      await client.query(
        `INSERT INTO "BDproyect"."tracking_batches" (batch_id, travel_id, points_count)
         VALUES ($1, $2, $3)`,
        [batchId, travelId, coords.length]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          message: `${coords.length} coordenadas insertadas para travelId ${travelId}`,
          batchId
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error en endpoint /api/colective/tracking:", error);

    if (error.code === "23505") {
      // Violación de unicidad
      return NextResponse.json({ error: "Batch duplicado" }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
