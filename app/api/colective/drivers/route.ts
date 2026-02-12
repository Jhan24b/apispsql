import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const allowedOrigins = [
  "http://localhost:3000",
  "https://colectivedriver.vercel.app",
  "https://colectivedrivery.vercel.app"
];

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin":
      origin && allowedOrigins.includes(origin) ? origin : "",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(req.headers.get("origin"))
  });
}

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const {
      name,
      email,
      license,
      route_id,
      lat,
      lng,
      status,
      car_license_plate,
      car_model,
      car_observations,
      company_id
    } = await req.json();

    // Validaciones básicas
    if (!name || !license) {
      return NextResponse.json(
        { error: "name y license son obligatorios" },
        { status: 400 }
      );
    }

    // Iniciar transacción
    await client.query("BEGIN");

    // 1. CREAR USUARIO
    // Generar email si no existe
    const userEmail = email || `${license.toLowerCase()}@driver.com`;

    // Generar contraseña temporal
    const tempPassword = await bcrypt.hash("drivercolective341", 10);

    // Foto genérica
    const defaultPhoto =
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face";

    const userResult = await client.query(
      `INSERT INTO "BDproyect"."users" 
       (email, password, name, photo, role, company_id)
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [userEmail, tempPassword, name, defaultPhoto, "driver", company_id || 1]
    );

    const userId = userResult.rows[0].id;

    // 2. CREAR AUTO (si hay datos o crear uno genérico)
    let carId = null;

    if (car_license_plate && car_license_plate.trim()) {
      // Crear auto con datos proporcionados
      const carResult = await client.query(
        `INSERT INTO "BDproyect"."cars" 
         (license_plate, model, observations)
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [
          car_license_plate.toUpperCase(),
          car_model || "Sin especificar",
          car_observations || ""
        ]
      );
      carId = carResult.rows[0].id;
    } else {
      // Crear auto genérico
      const genericPlate = `GEN-${Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, "0")}`;
      const carResult = await client.query(
        `INSERT INTO "BDproyect"."cars" 
         (license_plate, model, observations)
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [genericPlate, "Vehículo genérico", "Auto asignado temporalmente"]
      );
      carId = carResult.rows[0].id;
    }

    // 3. CREAR DRIVER
    const driverResult = await client.query(
      `INSERT INTO "BDproyect"."drivers" 
       (user_id, license, car_id, route_id, lat, lng, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [
        userId,
        license.toUpperCase(),
        carId,
        route_id || null,
        lat || 0,
        lng || 0,
        status || "Disponible"
      ]
    );

    // Confirmar transacción
    await client.query("COMMIT");

    // 4. OBTENER EL DRIVER COMPLETO CON TODAS SUS RELACIONES
    const driverCompleteResult = await pool.query(
      `SELECT
        d.id AS driver_id,
        d.license,
        d.lat,
        d.lng,
        d.status,
        u.id AS user_id,
        u.name AS user_name,
        u.photo AS user_photo,
        r.id AS route_id,
        r.name AS route_name,
        car.id AS car_id,
        car.license_plate,
        car.model,
        car.observations
      FROM "BDproyect"."drivers" d
      JOIN "BDproyect"."users" u ON d.user_id = u.id
      LEFT JOIN "BDproyect"."cars" car ON d.car_id = car.id
      LEFT JOIN "BDproyect"."route" r ON r.id = d.route_id
      WHERE d.id = $1`,
      [driverResult.rows[0].id]
    );

    const row = driverCompleteResult.rows[0];
    const driver = {
      id: row.driver_id,
      name: row.user_name,
      photo: row.user_photo,
      license: row.license,
      lat: row.lat,
      lng: row.lng,
      status: row.status,
      route: row.route_id
        ? {
            id: row.route_id,
            name: row.route_name
          }
        : null,
      car: row.car_id
        ? {
            id: row.car_id,
            license_plate: row.license_plate,
            model: row.model,
            observation: row.observations
          }
        : null
    };

    return NextResponse.json(driver, {
      status: 201,
      headers: corsHeaders(req.headers.get("origin"))
    });
  } catch (err) {
    // Rollback en caso de error
    await client.query("ROLLBACK");

    console.log("Error en createDriver:", JSON.stringify(err, null, 2));

    let errorMsg = "Error creando conductor";

    if (err instanceof Error) {
      // Detectar errores específicos de PostgreSQL
      if (err.message.includes("duplicate key")) {
        if (err.message.includes("license")) {
          errorMsg = "La licencia ya está registrada";
        } else if (err.message.includes("email")) {
          errorMsg = "El email ya está registrado";
        } else if (err.message.includes("license_plate")) {
          errorMsg = "La placa del vehículo ya está registrada";
        }
      } else {
        errorMsg = err.message;
      }
    }

    return NextResponse.json(
      { error: errorMsg },
      { status: 500, headers: corsHeaders(req.headers.get("origin")) }
    );
  } finally {
    client.release();
  }
}
