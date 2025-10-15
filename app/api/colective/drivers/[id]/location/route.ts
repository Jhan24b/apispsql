import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { lat, lng } = await req.json();

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "Los campos lat y lng son obligatorios" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE "BDproyect"."drivers" 
       SET lat = $1, lng = $2
       WHERE id = $3`,
      [lat, lng, id]
    );

    return NextResponse.json({
      success: true,
      message: "Ubicación actualizada correctamente",
      lat,
      lng
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Error actualizando ubicación"
      },
      { status: 500 }
    );
  }
}
