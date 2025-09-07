import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type LogEntry = {
  deviceId: string;
  appName: string;
  message?: string;
  receivedAt: string;
};

export async function POST(req: NextRequest) {
  try {
    const { logs } = await req.json();
    // logs = [{ deviceId, appName, message, receivedAt }, ...]

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json(
        { error: "Debe enviar un array de logs" },
        { status: 400 }
      );
    }

    const values = logs.map(
      (i: number) =>
        `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
    );

    const flatParams = logs.flatMap((l: LogEntry) => [
      l.deviceId,
      l.appName,
      l.message || null,
      l.receivedAt,
    ]);

    const query = `
      INSERT INTO "modificaciones".notifications_log (device_id, app_name, message, received_at)
      VALUES ${values.join(",")}
      RETURNING *`;

    const result = await pool.query(query, flatParams);

    return NextResponse.json({ inserted: result.rows }, { status: 201 });
  } catch (err) {
    console.error("Error en bulk insert:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error inesperado" },
      { status: 500 }
    );
  }
}
