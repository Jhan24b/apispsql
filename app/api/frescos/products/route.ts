import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      // Traer producto específico con precios y vendor
      const query = `
        SELECT p.*, v.name as vendor_name, v.last_name as vendor_last_name,
               v.phone as vendor_phone, v.address as vendor_address, v.email as vendor_email,
               json_agg(json_build_object(
                 'type', pt.name,
                 'value', pp.value
               )) as prices
        FROM "frescos".products p
        JOIN "frescos".vendors v ON v.id = p.vendor_id
        LEFT JOIN "frescos".product_prices pp ON p.id = pp.product_id
        LEFT JOIN "frescos".price_types pt ON pt.id = pp.price_type_id
        WHERE p.id = $1
        GROUP BY p.id, v.id;
      `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0]);
    }

    // Lista de todos los productos
    const query = `
      SELECT p.*, v.name as vendor_name, v.last_name as vendor_last_name,
             json_agg(json_build_object(
               'type', pt.name,
               'value', pp.value
             )) as prices
      FROM "frescos".products p
      JOIN "frescos".vendors v ON v.id = p.vendor_id
      LEFT JOIN "frescos"."product_prices" pp ON p.id = pp.product_id
      LEFT JOIN "frescos"."price_types" pt ON pt.id = pp.price_type_id
      GROUP BY p.id, v.id
      ORDER BY p.id ASC;
    `;

    const result = await pool.query(query);
    return NextResponse.json(result.rows);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
