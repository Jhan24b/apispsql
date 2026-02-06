import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface TripRecord {
  id: number;
  driver_id: number;
  started_at: number;
  ended_at: number | null;
  completed: boolean;
  duration: { hours: number; minutes: number; seconds: number } | null;
  desvio: boolean;
  actual_path: Array<{ lat: number; lng: number }> | null;
  expected_path: Array<{ lat: number; lng: number }> | null;
}

const allowedOrigins = [
  "http://localhost:3000",
  "https://colectivedriver.vercel.app"
];

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  return new NextResponse(null, { status: 200 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const origin = req.headers.get("origin");
  const isAllowed = origin && allowedOrigins.includes(origin);

  try {
    const { driverId } = await params;
    const searchParams = req.nextUrl.searchParams;

    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Generar fechas en zona horaria de Lima (UTC-5)
    const limaTimeZone = "America/Lima";
    const now = new Date();

    let startDateTime: Date;
    let endDateTime: Date;

    if (startDate && endDate) {
      startDateTime = new Date(`${startDate}T00:00:00`);
      endDateTime = new Date(`${endDate}T23:59:59`);
    } else if (startDate) {
      startDateTime = new Date(`${startDate}T00:00:00`);
      endDateTime = new Date(`${startDate}T23:59:59`);
    } else {
      // Día actual en zona horaria de Lima
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: limaTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });

      const parts = formatter.formatToParts(now);
      const dateObj = parts.reduce((acc: any, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});

      const todayString = `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
      startDateTime = new Date(`${todayString}T00:00:00`);
      endDateTime = new Date(`${todayString}T23:59:59`);
    }

    const result = await pool.query(
      `SELECT
        t.id,
        t.driver_id,
        t.started_at,
        t.ended_at,
        t.completed,
        t.duration,
        t.desvio,
        COALESCE(
          json_agg(
            json_build_object('lat', (p.coordinates->>'lat')::FLOAT, 'lng', (p.coordinates->>'lng')::FLOAT)
            ORDER BY p.id
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) AS coordinates
       FROM "BDproyect"."travel" t
       LEFT JOIN "BDproyect"."path" p ON p."travelId" = t.id
       WHERE t.driver_id = $1
         AND t.started_at >= $2
         AND t.started_at <= $3
       GROUP BY t.id, t.driver_id, t.started_at, t.ended_at, t.completed, t.duration, t.desvio
       ORDER BY t.started_at DESC`,
      [driverId, startDateTime.toISOString(), endDateTime.toISOString()]
    );

    // Transformar la respuesta al formato esperado
    const travels: TripRecord[] = result.rows.map((row: any) => {
      const startedAt = new Date(row.started_at);
      const endedAt = row.ended_at ? new Date(row.ended_at) : null;

      // Parsear la duración del formato INTERVAL de PostgreSQL
      const durationObj = parseDuration(row.duration);

      return {
        id: row.id,
        driver_id: row.driver_id,
        started_at: Math.floor(startedAt.getTime() / 1000),
        ended_at: endedAt ? Math.floor(endedAt.getTime() / 1000) : null,
        duration: durationObj,
        completed: row.completed,
        desvio: row.desvio,
        has_deviation: row.desvio,
        actual_path: row.coordinates || [],
        expected_path: []
      };
    });

    const responseFinal = NextResponse.json(travels);

    if (isAllowed) {
      responseFinal.headers.set("Access-Control-Allow-Origin", origin);
      responseFinal.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
      responseFinal.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }

    return responseFinal;
  } catch (err) {
    console.error("Error fetching travels:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * Parsea el formato INTERVAL de PostgreSQL a un objeto de duración
 * Ej: "01:30:45" => { hours: 1, minutes: 30, seconds: 45 }
 */
function parseDuration(
  durationStr: string | null
): { hours: number; minutes: number; seconds: number } | null {
  if (!durationStr) return null;

  try {
    const [hours, minutes, seconds] = durationStr.split(":").map(Number);
    return { hours, minutes, seconds };
  } catch {
    return null;
  }
}
