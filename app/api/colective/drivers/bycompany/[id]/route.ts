import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // obtener query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // construir query dinámico
    let query = `
      SELECT
        d.id AS driver_id,
        d.license,
        d.lat,
        d.lng,
        d.status,
        u.id AS user_id,
        u.name AS user_name,
        u.photo AS user_photo,
        r.id AS route_id,
        r.name AS route_name,
        car.id AS car_id,
        car.license_plate,
        car.model,
        car.observations
      FROM "BDproyect"."drivers" d
      JOIN "BDproyect"."users" u ON d.user_id = u.id
      JOIN "BDproyect"."cars" car ON d.car_id = car.id
      JOIN "BDproyect"."route" r ON r.id = d.route_id
      WHERE u.company_id = $1
    `;

    const paramsArr: string[] = [id];

    if (status) {
      query += ` AND d.status = $2`;
      paramsArr.push(status);
    }

    const result = await pool.query(query, paramsArr);

    const drivers = result.rows.map((row) => ({
      id: row.driver_id,
      license: row.license,
      lat: row.lat,
      lng: row.lng,
      status: row.status,
      user: {
        id: row.user_id,
        name: row.user_name,
        photo: row.user_photo
      },
      route: {
        id: row.route_id,
        name: row.route_name
      },
      car: {
        id: row.car_id,
        license_plate: row.license_plate,
        model: row.model,
        observations: row.observations
      }
    }));

    return NextResponse.json(drivers);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
