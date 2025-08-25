import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "API Backend funcionando correctamente 🚀",
    timestamp: new Date().toISOString(),
  });
}
