import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { DateTime } from "luxon";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT * FROM "BDproyect"."payments" WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    row.created_at = DateTime.fromJSDate(row.created_at)
      .setZone("America/Lima")
      .toISO({ suppressMilliseconds: true });
    row.paid_at = DateTime.fromJSDate(row.paid_at)
      .setZone("America/Lima")
      .toISO({ suppressMilliseconds: true });
    row.verified_at = DateTime.fromJSDate(row.verified_at)
      .setZone("America/Lima")
      .toISO({ suppressMilliseconds: true });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, method } = await req.json();

    if (status === "Verified") {
      const result = await pool.query(
        `UPDATE "BDproyect"."payments"
        SET
          verified_at = CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima'
        WHERE id = $1
        RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Pago no encontrado" },
          { status: 404 }
        );
      }
      const row = result.rows[0];

      row.created_at = DateTime.fromJSDate(row.created_at)
        .setZone("America/Lima")
        .toISO({ suppressMilliseconds: true });
      row.paid_at = DateTime.fromJSDate(row.paid_at)
        .setZone("America/Lima")
        .toISO({ suppressMilliseconds: true });
      row.verified_at = DateTime.fromJSDate(row.verified_at)
        .setZone("America/Lima")
        .toISO({ suppressMilliseconds: true });
      return NextResponse.json(row);
    }
    const result = await pool.query(
      `UPDATE "BDproyect"."payments"
       SET status = COALESCE($1, status),
           method = COALESCE($2, method),
           paid_at = CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima'
       WHERE id = $3
       RETURNING *`,
      [status, method, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    row.created_at = DateTime.fromJSDate(row.created_at)
      .setZone("America/Lima")
      .toISO({ suppressMilliseconds: true });
    row.paid_at = DateTime.fromJSDate(row.paid_at)
      .setZone("America/Lima")
      .toISO({ suppressMilliseconds: true });
    row.verified_at = DateTime.fromJSDate(row.verified_at)
      .setZone("America/Lima")
      .toISO({ suppressMilliseconds: true });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `DELETE FROM "BDproyect"."payments" WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Pago eliminado correctamente",
      deleted: result.rows[0]
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
