import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

// GET - Obtener producto por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await pool.query(
      `
      SELECT 
        p.*,
        v.name as vendor_name,
        v.last_name as vendor_last_name,
        v.phone as vendor_phone,
        v.address as vendor_address,
        v.email as vendor_email,
        json_agg(
          json_build_object(
            'price_type_id', pp.price_type_id,
            'price_type_name', pt.name,
            'value', pp.value
          )
        ) as prices
      FROM "frescos"."products" p
      LEFT JOIN "frescos"."vendors" v ON p.vendor_id = v.id
      LEFT JOIN "frescos"."product_prices" pp ON p.id = pp.product_id
      LEFT JOIN "frescos"."price_types" pt ON pp.price_type_id = pt.id
      WHERE p.id = $1
      GROUP BY p.id, v.id
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product: result.rows[0] });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Actualizar producto
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
    const {
      name,
      category,
      image,
      unit,
      description,
      vendor_id,
      in_stock,
      featured,
      prices
    } = await req.json();

    // Actualizar producto
    const result = await pool.query(
      `
      UPDATE "frescos"."products" 
      SET name = $1, category = $2, image = $3, unit = $4, description = $5, 
          vendor_id = $6, in_stock = $7, featured = $8
      WHERE id = $9
      RETURNING *
    `,
      [
        name,
        category,
        image,
        unit,
        description,
        vendor_id,
        in_stock,
        featured,
        id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar precios si se proporcionan
    if (prices && Array.isArray(prices)) {
      // Eliminar precios existentes
      await pool.query(
        `DELETE FROM "frescos"."product_prices" WHERE product_id = $1`,
        [id]
      );

      // Insertar nuevos precios
      for (const price of prices) {
        await pool.query(
          `
          INSERT INTO "frescos"."product_prices" (product_id, price_type_id, value)
          VALUES ($1, $2, $3)
        `,
          [id, price.price_type_id, price.value]
        );
      }
    }

    return NextResponse.json({
      message: "Producto actualizado exitosamente",
      product: result.rows[0]
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Eliminar producto
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

    // Eliminar precios del producto primero (foreign key constraint)
    await pool.query(
      `DELETE FROM "frescos"."product_prices" WHERE product_id = $1`,
      [id]
    );

    // Eliminar producto
    const result = await pool.query(
      `DELETE FROM "frescos"."products" WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Producto eliminado exitosamente" });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
