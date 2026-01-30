import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

export async function OPTIONS(req: NextRequest) {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://colectivedriver.vercel.app",
    "https://colectivedrivery.vercel.app"
  ];

  const origin = req.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token no proporcionado" },
        { status: 401 }
      );
    }

    // ============================================
    // 1. VALIDAR REFRESH TOKEN
    // ============================================

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!
      ) as { id: string; email: string; type: string };
    } catch (error) {
      return NextResponse.json(
        { error: "Refresh token inválido o expirado" },
        { status: 401 }
      );
    }

    if (decoded.type !== "refresh") {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // ============================================
    // 2. VERIFICAR EN BD QUE NO ESTÁ REVOCADO
    // ============================================

    const tokenResult = await pool.query(
      `
      SELECT rt.*, u.role, u.email
      FROM "BDproyect"."refresh_tokens" rt
      JOIN "BDproyect"."users" u ON rt.user_id = u.id
      WHERE rt.token = $1 AND rt.revoked = FALSE
      `,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Refresh token revocado o no existe" },
        { status: 401 }
      );
    }

    const tokenData = tokenResult.rows[0];

    // ============================================
    // 3. GENERAR NUEVO ACCESS TOKEN
    // ============================================

    const newAccessToken = jwt.sign(
      { id: tokenData.user_id, email: tokenData.email, role: tokenData.role },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    // ============================================
    // 4. OPCIONAL: ROTACIÓN DE REFRESH TOKEN
    // ============================================
    // Genera un nuevo refresh token y revoca el anterior
    // Esto es más seguro pero más complejo

    const newRefreshToken = jwt.sign(
      { id: tokenData.user_id, email: tokenData.email, type: "refresh" },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Guardar nuevo refresh token y marcar el anterior como revocado
    await pool.query(
      `
      UPDATE "BDproyect"."refresh_tokens" 
      SET revoked = TRUE 
      WHERE token = $1
      `,
      [refreshToken]
    );

    await pool.query(
      `
      INSERT INTO "BDproyect"."refresh_tokens" 
      (user_id, token, expires_at) 
      VALUES ($1, $2, $3)
      `,
      [tokenData.user_id, newRefreshToken, expiresAt]
    );

    // ============================================
    // 5. RESPUESTA
    // ============================================

    const response = NextResponse.json({
      token: newAccessToken,
      refreshToken: newRefreshToken
    });

    // Actualizar cookies
    response.cookies.set("auth_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/"
    });

    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/api/auth/refresh"
    });

    const origin = req.headers.get("origin");
    const allowedOrigins = [
      "http://localhost:3000",
      "https://colectivedriver.vercel.app",
      "https://colectivedrivery.vercel.app"
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }

    return response;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
