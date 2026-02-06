import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/rooms/[id] - Get a single room
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT /api/rooms/[id] - Update a room
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from("rooms")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/rooms/[id] - Delete a room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { id } = await params;

    const { error } = await supabase.from("rooms").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
