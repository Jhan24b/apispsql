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
        u.id,
        u.email,
        u.password,
        u.name,
        u.photo,
        u.role,
        u.company_id,
        c.name AS company_name,
        c.logo AS company_logo
      FROM "BDproyect"."users" u
      LEFT JOIN "BDproyect"."company" c
        ON u.company_id = c.id
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

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        photo: user.photo,
        company: user.company_id
          ? {
              id: user.company_id,
              name: user.company_name,
              logo: user.company_logo
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
