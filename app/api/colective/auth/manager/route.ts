import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

export async function OPTIONS(req: NextRequest) {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://colectivedriver.vercel.app"
  ];

  const origin = req.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true"
      }
    });
  }

  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    // ============================================
    // 1. VALIDAR USUARIO
    // ============================================
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

    // ============================================
    // 2. GENERAR TOKENS
    // ============================================

    // Access Token - corta duración (15 minutos)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    // Refresh Token - larga duración (7 días)
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, type: "refresh" },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // ============================================
    // 3. GUARDAR REFRESH TOKEN EN BD
    // ============================================
    // Esto permite revocar tokens o hacer seguimiento

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await pool.query(
      `
      INSERT INTO "BDproyect"."refresh_tokens" 
      (user_id, token, expires_at) 
      VALUES ($1, $2, $3)
      `,
      [user.id, refreshToken, expiresAt]
    );

    // ============================================
    // 4. PREPARAR RESPUESTA
    // ============================================

    const response = NextResponse.json({
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
      token: accessToken, // ← Access Token (15 min)
      refreshToken: refreshToken // ← Refresh Token (7 días)
    });

    // ============================================
    // 5. CONFIGURAR COOKIES SEGURAS
    // ============================================

    // Access Token en cookie (corta duración)
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutos
      path: "/"
    });

    // Refresh Token en cookie (larga duración)
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: "/auth/refresh"
    });

    const origin = req.headers.get("origin");
    const allowedOrigins = [
      "http://localhost:3000",
      "https://colectivedriver.vercel.app"
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
