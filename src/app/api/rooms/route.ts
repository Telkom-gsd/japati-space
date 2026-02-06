import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/rooms - Get all rooms or filter by floor
export async function GET(request: NextRequest) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured - returning empty rooms array");
    return NextResponse.json([]);
  }

  const searchParams = request.nextUrl.searchParams;
  const floor = searchParams.get("floor");

  try {
    let query = supabase.from("rooms").select("*");

    if (floor) {
      query = query.eq("floor", floor);
    }

    const { data, error } = await query.order("code");

    if (error) {
      console.error("Supabase query error:", error.message);
      // Return empty array if database query fails
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    // Handle network errors gracefully
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching rooms:", errorMessage);
    return NextResponse.json([]);
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    const { data, error } = await supabase.from("rooms").insert(body).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
