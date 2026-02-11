import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { floor, svgContent } = await request.json();

    if (!floor || !svgContent) {
      return NextResponse.json(
        { message: "Floor dan svgContent harus disediakan" },
        { status: 400 }
      );
    }

    // Sanitize floor name to prevent issues
    const sanitizedFloor = floor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const fileName = `${sanitizedFloor}.svg`;
    
    // Convert SVG content to Blob for upload
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });

    // Upload to Supabase Storage (bucket: 'denah')
    const { error: uploadError } = await supabase.storage
      .from("denah")
      .upload(fileName, svgBlob, {
        contentType: "image/svg+xml",
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error("Supabase Storage error:", uploadError);
      return NextResponse.json(
        { message: `Gagal menyimpan: ${uploadError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `SVG ${fileName} berhasil disimpan ke storage` 
    });

  } catch (error) {
    console.error("Error saving SVG:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan file SVG" },
      { status: 500 }
    );
  }
}
