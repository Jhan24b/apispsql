import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

// GET - Obtener todos los productos con sus precios y vendedor
export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(`
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
      GROUP BY p.id, v.id
      ORDER BY p.id DESC
    `);

    return NextResponse.json({
      products: result.rows,
      total: result.rows.length
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Crear nuevo producto
export async function POST(req: NextRequest) {
  try {
    // Verificar token JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

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

    // Validaciones básicas
    if (!name || !category || !vendor_id) {
      return NextResponse.json(
        { error: "Campos requeridos: name, category, vendor_id" },
        { status: 400 }
      );
    }

    // Insertar producto
    const productResult = await pool.query(
      `
      INSERT INTO "frescos"."products" (name, category, image, unit, description, vendor_id, in_stock, featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        name,
        category,
        image,
        unit,
        description,
        vendor_id,
        in_stock || true,
        featured || false
      ]
    );

    const product = productResult.rows[0];

    // Insertar precios si se proporcionan
    if (prices && Array.isArray(prices)) {
      for (const price of prices) {
        await pool.query(
          `
          INSERT INTO "frescos"."product_prices" (product_id, price_type_id, value)
          VALUES ($1, $2, $3)
        `,
          [product.id, price.price_type_id, price.value]
        );
      }
    }

    return NextResponse.json(
      {
        message: "Producto creado exitosamente",
        product
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
