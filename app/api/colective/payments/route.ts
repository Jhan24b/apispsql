import pool from "@/lib/db";
import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { driver_id, amount } = await req.json();

    const result = await pool.query(
      `INSERT INTO "BDproyect"."payments" (driver_id, amount, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima') RETURNING *`,
      [driver_id, amount]
    );

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

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT *
       FROM "BDproyect"."payments"
       WHERE created_at::date = (CURRENT_DATE AT TIME ZONE 'America/Lima')`
    );

    const payments = result.rows.map((row) => ({
      ...row,
      created_at: row.created_at
        ? DateTime.fromJSDate(row.created_at)
            .setZone("America/Lima")
            .toISO({ suppressMilliseconds: true })
        : null,
      paid_at: row.paid_at
        ? DateTime.fromJSDate(row.paid_at)
            .setZone("America/Lima")
            .toISO({ suppressMilliseconds: true })
        : null,
      verified_at: row.verified_at
        ? DateTime.fromJSDate(row.verified_at)
            .setZone("America/Lima")
            .toISO({ suppressMilliseconds: true })
        : null
    }));

    return NextResponse.json({ payments });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
