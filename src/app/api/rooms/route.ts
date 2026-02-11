import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/rooms - Get all rooms or filter by floor
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const floor = searchParams.get("floor");

    let query = supabase.from("rooms").select("*");

    if (floor) {
      query = query.eq("floor", floor);
    }

    const { data, error } = await query.order("code");

    if (error) {
      console.error("Supabase query error:", error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching rooms:", errorMessage);
    return NextResponse.json([]);
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError?.message || "No user");
      return NextResponse.json({ error: "Unauthorized - Please login again" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      console.error("Profile error or not admin:", profileError?.message || profile?.role);
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    console.log("Creating room:", JSON.stringify(body, null, 2));
    console.log("User:", user.email, "Role:", profile.role);

    const { data, error } = await supabase.from("rooms").insert(body).select().single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Room created successfully:", data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
