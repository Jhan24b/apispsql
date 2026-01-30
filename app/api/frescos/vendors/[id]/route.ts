import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

// GET - Obtener vendedor por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await pool.query(
      `
      SELECT * FROM "frescos"."vendors" WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Vendedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ vendor: result.rows[0] });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Actualizar vendedor
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar token JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    const { id } = params;
    const { name, last_name, phone, address, email } = await req.json();

    // Verificar si el email ya existe en otro vendedor
    if (email) {
      const existingVendor = await pool.query(
        `
        SELECT id FROM "frescos"."vendors" WHERE email = $1 AND id != $2
      `,
        [email, id]
      );

      if (existingVendor.rows.length > 0) {
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(
      `
      UPDATE "frescos"."vendors" 
      SET name = $1, last_name = $2, phone = $3, address = $4, email = $5
      WHERE id = $6
      RETURNING *
    `,
      [name, last_name, phone, address, email, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Vendedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Vendedor actualizado exitosamente",
      vendor: result.rows[0]
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Eliminar vendedor
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar token JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    const { id } = params;

    // Verificar si el vendedor tiene productos asociados
    const productsCheck = await pool.query(
      `
      SELECT COUNT(*) as count FROM "frescos"."products" WHERE vendor_id = $1
    `,
      [id]
    );

    if (Number.parseInt(productsCheck.rows[0].count) > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el vendedor porque tiene productos asociados"
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM "frescos"."vendors" WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Vendedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Vendedor eliminado exitosamente" });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
