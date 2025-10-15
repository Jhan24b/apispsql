import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "El campo status es obligatorio" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE "BDproyect"."drivers" 
       SET status = $1
       WHERE id = $2`,
      [status, id]
    );

    // Obtener el driver actualizado
    const result = await pool.query(
      `SELECT
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
      LEFT JOIN "BDproyect"."cars" car ON d.car_id = car.id
      LEFT JOIN "BDproyect"."route" r ON r.id = d.route_id
      WHERE d.id = $1`,
      [id]
    );

    const row = result.rows[0];
    const driver = {
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
      route: row.route_id
        ? {
            id: row.route_id,
            name: row.route_name
          }
        : null,
      car: row.car_id
        ? {
            id: row.car_id,
            license_plate: row.license_plate,
            model: row.model,
            observations: row.observations
          }
        : null
    };

    return NextResponse.json(driver);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Error actualizando estado"
      },
      { status: 500 }
    );
  }
}
