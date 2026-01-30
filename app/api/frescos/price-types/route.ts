import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

// GET - Obtener todos los tipos de precio
export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(`
      SELECT * FROM "frescos"."price_types" 
      ORDER BY name ASC
    `);

    return NextResponse.json({
      priceTypes: result.rows,
      total: result.rows.length
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Crear nuevo tipo de precio
export async function POST(req: NextRequest) {
  try {
    // Verificar token JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await pool.query(
      `
      SELECT id FROM "frescos"."price_types" WHERE name = $1
    `,
      [name]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "El tipo de precio ya existe" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      INSERT INTO "frescos"."price_types" (name)
      VALUES ($1)
      RETURNING *
    `,
      [name]
    );

    return NextResponse.json(
      {
        message: "Tipo de precio creado exitosamente",
        priceType: result.rows[0]
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
