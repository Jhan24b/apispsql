import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { driverId, desvio, coords } = body;

    if (!driverId || !Array.isArray(coords) || coords.length === 0) {
      return NextResponse.json(
        { error: "Parámetros inválidos: falta driverId o coords[]" },
        { status: 400 }
      );
    } else {
      const result = await pool.query(
        `INSERT INTO "BDproyect"."path" (driverId, desvio, coords)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
        [driverId, desvio, coords]
      );
      if (result.rows.length > 0) {
        return NextResponse.json(
          {
            result: result.rows[0],
          },
          { status: 201 }
        );
      }
    }
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { driverId: string } }
) {
  const { driverId } = params;

  const routes = [
    {
      route_id: 12,
      route_name: "Centro Histórico",
      driver_name: "Carlos Vega",
      driver_photo: "https://cdn/img/driver12.jpg",
      desvio: false,
      coordinates: [
        { lat: -12.046, lng: -77.042, timestamp: "2025-11-10T12:00:00Z" },
        { lat: -12.047, lng: -77.041, timestamp: "2025-11-10T12:01:00Z" },
        { lat: -12.048, lng: -77.04, timestamp: "2025-11-10T12:02:00Z" },
        { lat: -12.049, lng: -77.039, timestamp: "2025-11-10T12:03:00Z" },
        { lat: -12.05, lng: -77.038, timestamp: "2025-11-10T12:04:00Z" },
      ],
      fecha: new Date().toISOString(),
    },
  ];

  return NextResponse.json({ routes, driverId });
}
