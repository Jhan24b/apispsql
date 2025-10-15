import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Conductor no encontrado" },
        { status: 404 }
      );
    }

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
        error: err instanceof Error ? err.message : "Error obteniendo conductor"
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { license, car_id, route_id, lat, lng, status } = await req.json();

    // Construir query dinámico
    const updates: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (license !== undefined) {
      updates.push(`license = $${paramIndex++}`);
      values.push(license);
    }
    if (car_id !== undefined) {
      updates.push(`car_id = $${paramIndex++}`);
      values.push(car_id);
    }
    if (route_id !== undefined) {
      updates.push(`route_id = $${paramIndex++}`);
      values.push(route_id);
    }
    if (lat !== undefined) {
      updates.push(`lat = $${paramIndex++}`);
      values.push(lat);
    }
    if (lng !== undefined) {
      updates.push(`lng = $${paramIndex++}`);
      values.push(lng);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    values.push(id);

    await pool.query(
      `UPDATE "BDproyect"."drivers" 
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}`,
      values
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
        error:
          err instanceof Error ? err.message : "Error actualizando conductor"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `DELETE FROM "BDproyect"."drivers" 
       WHERE id = $1 
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Conductor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conductor eliminado correctamente"
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Error eliminando conductor"
      },
      { status: 500 }
    );
  }
}
