import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/rooms/[id] - Get a single room with contracts
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeContracts = searchParams.get("include_contracts") === "true";

    // Fetch room data
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (roomError) {
      return NextResponse.json({ error: roomError.message }, { status: 404 });
    }

    // Optionally fetch contracts
    if (includeContracts) {
      const { data: contracts, error: contractsError } = await supabase
        .from("room_contracts")
        .select("*")
        .eq("room_id", id)
        .order("contract_start", { ascending: false });

      if (!contractsError) {
        room.contracts = contracts || [];
      }
    }

    return NextResponse.json(room);
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

    // Log the incoming data for debugging
    console.log("Updating room:", id);
    console.log("Update data:", JSON.stringify(body, null, 2));

    // First, update the room
    const { error: updateError } = await supabase
      .from("rooms")
      .update(body)
      .eq("id", id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Then fetch the updated room
    const { data, error: fetchError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("PUT error:", error);
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
