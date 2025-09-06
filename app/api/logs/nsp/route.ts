import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { deviceId, appName, message, receivedAt } = await req.json();

    if (!deviceId || !appName || !receivedAt) {
      return NextResponse.json(
        { error: "deviceId, appName y receivedAt son requeridos" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO "modificaciones".notifications_log (device_id, app_name, message, received_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [deviceId, appName, message || null, receivedAt]
    );

    return NextResponse.json({ log: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error insertando log:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error inesperado" },
      { status: 500 }
    );
  }
}
