import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

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
      WHERE u.email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    if (role && user.role !== role) {
      return NextResponse.json({ error: "Rol no autorizado" }, { status: 403 });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d"
    });

    const actualizacionEstadoDriver = await pool.query(
      `UPDATE "BDproyect"."drivers" SET status = 'online' where user_id = $1 Returning *`,
      [user.user_id]
    );

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
    // 👇 Validamos si err es una instancia de Error
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Ruta logincolective viva 🚀"
  });
}

//FALTA CREAR RUTA PARA PODER REGISTRAR LA HORA DE ULTIMA CONEXION Y EL ESTADO A DESCONECTADO PARA CUANDO HAGA LOGOUT
