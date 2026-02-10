import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET: Fetch contracts, optionally filtered by room_id
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room_id");

    let query = supabase
      .from("room_contracts")
      .select("*")
      .order("contract_start", { ascending: false });

    if (roomId) {
      query = query.eq("room_id", roomId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

// POST: Create a new contract
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { room_id, ...contractData } = body;

    if (!room_id) {
      return NextResponse.json(
        { error: "room_id is required" },
        { status: 400 }
      );
    }

    // Calculate contract status based on dates
    const today = new Date();
    let status: "active" | "expired" | "upcoming" = "active";
    
    if (contractData.contract_start && contractData.contract_end) {
      const startDate = new Date(contractData.contract_start);
      const endDate = new Date(contractData.contract_end);
      
      if (today < startDate) {
        status = "upcoming";
      } else if (today > endDate) {
        status = "expired";
      } else {
        status = "active";
      }
    }

    const { data, error } = await supabase
      .from("room_contracts")
      .insert([
        {
          room_id,
          ...contractData,
          status,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Failed to create contract" },
      { status: 500 }
    );
  }
}
