import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

const allowedOrigins = [
  "http://localhost:3000",
  "https://colectivedriver.vercel.app",
  "https://colectivedrivery.vercel.app"
];

function applyCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.headers.set(
      "Access-Control-Allow-Methods",
      "POST, GET, OPTIONS"
    );
  }

  return res;
}

export async function OPTIONS(req: NextRequest) {
  return applyCors(req, new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  console.log("Auth Manager POST request received");
  try {
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return applyCors(
        req,
        NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
      );
    }

    // ============================================
    // 1. VALIDAR USUARIO
    // ============================================
    const result = await pool.query(
      `
      SELECT 
        u.id, u.email, u.password, u.name, u.photo, u.role, u.company_id,
        c.name AS company_name, c.logo AS company_logo
      FROM "BDproyect"."users" u
      LEFT JOIN "BDproyect"."company" c ON u.company_id = c.id
      WHERE u.email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return applyCors(
        req,
        NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      );
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      console.log("Credenciales inválidas", password, user.password, valid);
      return applyCors(
        req,
        NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
      );
    }

    if (role && user.role !== role) {
      return applyCors(
        req,
        NextResponse.json({ error: "Rol no autorizado" }, { status: 403 })
      );
    }

    // ============================================
    // 2. GENERAR TOKENS
    // ============================================
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("Missing JWT_SECRET environment variable");
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;

    // Access Token - corta duración (15 minutos)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: "15m" }
    );

    // Refresh Token - larga duración (7 días)
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, type: "refresh" },
      jwtRefreshSecret,
      { expiresIn: "7d" }
    );

    // ============================================
    // 3. GUARDAR REFRESH TOKEN EN BD
    // ============================================
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      `
      INSERT INTO "BDproyect"."refresh_tokens" (user_id, token, expires_at) 
      VALUES ($1, $2, $3)
      `,
      [user.id, refreshToken, expiresAt]
    );

    // ============================================
    // 4. PREPARAR RESPUESTA
    // ============================================
    const responseData = {
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
      token: accessToken,
      refreshToken: refreshToken
    };

    const response = NextResponse.json(responseData);

    // ============================================
    // 5. CONFIGURAR COOKIES SEGURAS
    // ============================================
    const isProd = process.env.NODE_ENV === "production";

    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/"
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/auth/refresh"
    });

    return applyCors(req, response);
  } catch (err: unknown) {
    console.error("Auth Manager Error:", err);
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    return applyCors(
      req,
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
