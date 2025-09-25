import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Obtener parámetros de fecha
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");

    // Si no se especifican fechas, usar fecha actual
    const today = new Date().toISOString().split("T")[0];
    const startDate = fechaInicio || today;
    const endDate = fechaFin || today;

    const result = await pool.query(
      `SELECT
        p.id,
        p.amount,
        p.method,
        p.status,
        p.created_at,
        p.paid_at,
        p.verified_at,
        d.id AS driver_id,
        u.name AS driver_name,
        d.license AS driver_license,
        car.id AS car_id,
        car.license_plate,
        car.model,
        car.observations AS car_observation,
        d.route_id,
        d.lat,
        d.lng,
        d.status AS driver_status
      FROM "BDproyect"."payments" p
      JOIN "BDproyect"."drivers" d ON p.driver_id = d.id
      JOIN "BDproyect"."users" u ON d.user_id = u.id
      JOIN "BDproyect"."cars" car ON d.car_id = car.id
      WHERE p.driver_id = $1
        AND DATE(p.created_at) >= $2
        AND DATE(p.created_at) <= $3
      ORDER BY p.created_at DESC`,
      [id, startDate, endDate]
    );

    const payments = result.rows.map((row) => ({
      id: row.id,
      amount: parseFloat(row.amount),
      method: row.method,
      status: row.status,
      created_at: row.created_at,
      paid_at: row.paid_at,
      verified_at: row.verified_at,
      driver: {
        id: row.driver_id,
        name: row.driver_name,
        license: row.driver_license,
        car: {
          id: row.car_id,
          license_plate: row.license_plate,
          model: row.model,
          observation: row.car_observation
        },
        ruta_id: row.route_id,
        lat: row.lat,
        lng: row.lng,
        status: row.driver_status
      }
    }));

    return NextResponse.json(payments);
  } catch (err) {
    console.error("Database error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Error interno del servidor"
      },
      { status: 500 }
    );
  }
}
