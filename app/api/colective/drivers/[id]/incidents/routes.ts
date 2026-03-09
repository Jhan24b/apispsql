// Archivo: app/api/drivers/[id]/incidents/route.ts

import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "https://colectivedriver.vercel.app",
];

function applyCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.headers.set(
      "Access-Control-Allow-Methods",
      "POST, GET, OPTIONS"
    );
  }
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return applyCors(req, new NextResponse(null, { status: 204 }));
}

// POST: Sincronizar (Crear) un incidente
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const driverId = (await params).id;
    const {
      id, // Incident ID generated locally
      driverName,
      title,
      description,
      type,
      priority,
      status,
      location,
      vehiclePlate,
      images,
      notes,
      createdAt,
      updatedAt
    } = await req.json();

    if (!driverId || !title || !description || !location) {
      return applyCors(
        req,
        NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
      );
    }

    // Insertar el incidente en la DB
    const result = await pool.query(
      `INSERT INTO "BDproyect"."incidences" 
       (id_local, driver_id, driver_name, title, description, type, priority, status, location, vehicle_plate, images_json, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        id,
        driverId,
        driverName,
        title,
        description,
        type,
        priority,
        status || 'pending',
        location,
        vehiclePlate || null,
        images ? JSON.stringify(images) : null,
        notes || null,
        createdAt || new Date().toISOString(),
        updatedAt || new Date().toISOString()
      ]
    );

    return applyCors(
      req,
      NextResponse.json({ data: result.rows[0], synced: true }, { status: 201 })
    );
  } catch (err) {
    return applyCors(
      req,
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Error" },
        { status: 500 }
      )
    );
  }
}
