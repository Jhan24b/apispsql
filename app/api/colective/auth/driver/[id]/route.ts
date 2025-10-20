import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const { userId, newPassword } = await req.json();

    // Validar que se reciban los datos necesarios
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "Se requiere userId y newPassword" },
        { status: 400 }
      );
    }

    // Validar que la contraseña tenga una longitud mínima
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userResult = await pool.query(
      `SELECT id FROM "BDproyect"."users" WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y poner change_password en false
    await pool.query(
      `UPDATE "BDproyect"."users" 
       SET password = $1, change_password = false 
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    // Obtener los datos completos del usuario con la misma estructura del login
    const result = await pool.query(
      `
        SELECT 
          u.id AS user_id,
          u.email,
          u.password,
          u.name,
          u.photo,
          u.role,
          u.change_password,

          d.id AS driver_id,
          d.license,
          d.car_id,
          d.route_id,
          d.lat,
          d.lng,
          d.status,

          c.license_plate,
          c.model,
          c.observations

        FROM "BDproyect"."users" u
        LEFT JOIN "BDproyect"."drivers" d
          ON u.id = d.user_id
        LEFT JOIN "BDproyect"."cars" c
          ON d.car_id = c.id
        WHERE u.id = $1
        `,
      [userId]
    );

    const user = result.rows[0];

    // Generar nuevo token
    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET!, {
      expiresIn: "7d"
    });

    return NextResponse.json({
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        name: user.name,
        photo: user.photo,
        change_password: user.change_password,
        driver: user.driver_id
          ? {
              id: user.driver_id,
              license: user.license,
              car_id: user.car_id,
              ruta_id: user.route_id,
              lat: user.lat,
              lng: user.lng,
              status: user.status,
              car: user.car_id
                ? {
                    id: user.car_id,
                    license_plate: user.license_plate,
                    model: user.model,
                    observations: user.observations
                  }
                : null
            }
          : null
      },
      token
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Ruta de actualización de contraseña disponible 🔐"
  });
}
