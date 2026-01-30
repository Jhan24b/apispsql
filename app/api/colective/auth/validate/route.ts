import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // ============================================
    // 1. EXTRAER TOKEN DEL HEADER
    // ============================================

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // ============================================
    // 2. VALIDAR TOKEN JWT
    // ============================================

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        role: string;
      };
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    // ============================================
    // 3. OBTENER DATOS ACTUALES DEL USUARIO
    // ============================================
    // Consultamos la BD para obtener datos frescos
    // (en caso de que el perfil haya sido actualizado)

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.password,
        u.photo,
        u.role,
        u.company_id,
        c.name AS company_name,
        c.logo AS company_logo
      FROM "BDproyect"."users" u
      LEFT JOIN "BDproyect"."company" c
        ON u.company_id = c.id
      WHERE u.id = $1
      `,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // ============================================
    // 4. RESPUESTA CON DATOS ACTUALIZADOS
    // ============================================

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        photo: user.photo,
        company: user.company_id
          ? {
              id: user.company_id,
              name: user.company_name,
              logo: user.company_logo
            }
          : null
      }
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
