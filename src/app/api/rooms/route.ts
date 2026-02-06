import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/rooms - Get all rooms or filter by floor
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const floor = searchParams.get("floor");

  try {
    let query = supabase.from("rooms").select("*");

    if (floor) {
      query = query.eq("floor", floor);
    }

    const { data, error } = await query.order("code");

    if (error) {
      console.error("Supabase error:", error.message);
      // Return empty array if database is not configured
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json([]);
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase.from("rooms").insert(body).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
