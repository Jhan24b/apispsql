import { type NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET - Buscar productos con filtros
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const priceType = searchParams.get("priceType") || "unitario";
    const inStock = searchParams.get("inStock");
    const featured = searchParams.get("featured");

    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

    // Filtro por búsqueda de texto
    if (query) {
      whereConditions.push(
        `(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`
      );
      queryParams.push(`%${query}%`);
      paramIndex++;
    }

    // Filtro por categoría
    if (category) {
      whereConditions.push(`p.category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    // Filtro por stock
    if (inStock !== null) {
      whereConditions.push(`p.in_stock = $${paramIndex}`);
      queryParams.push(inStock === "true");
      paramIndex++;
    }

    // Filtro por destacados
    if (featured !== null) {
      whereConditions.push(`p.featured = $${paramIndex}`);
      queryParams.push(featured === "true");
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    let havingClause = "";
    if (minPrice || maxPrice) {
      const havingConditions = [];

      if (minPrice) {
        havingConditions.push(
          `MIN(CASE WHEN pt.name = '${priceType}' THEN pp.value END) >= $${paramIndex}`
        );
        queryParams.push(Number.parseFloat(minPrice));
        paramIndex++;
      }

      if (maxPrice) {
        havingConditions.push(
          `MAX(CASE WHEN pt.name = '${priceType}' THEN pp.value END) <= $${paramIndex}`
        );
        queryParams.push(Number.parseFloat(maxPrice));
        paramIndex++;
      }

      havingClause = `HAVING ${havingConditions.join(" AND ")}`;
    }

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
      ${whereClause}
      GROUP BY p.id, v.id
      ${havingClause}
      ORDER BY p.featured DESC, p.id DESC
    `,
      queryParams
    );

    return NextResponse.json({
      products: result.rows,
      total: result.rows.length,
      filters: {
        query,
        category,
        minPrice,
        maxPrice,
        priceType,
        inStock,
        featured
      }
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error desconocido en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
