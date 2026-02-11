import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface RouteParams {
  params: Promise<{ floor: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { floor } = await params;
    const supabase = await createClient();
    
    // Sanitize floor name
    const sanitizedFloor = floor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const fileName = `${sanitizedFloor}.svg`;

    // Try to get from Supabase Storage first
    const { data, error } = await supabase.storage
      .from("denah")
      .download(fileName);

    if (error) {
      // File not found in storage, return 404 to let frontend fallback to public folder
      console.log(`SVG not in storage, fallback to public: ${fileName}`);
      return NextResponse.json(
        { message: "File not found in storage", fallback: true },
        { status: 404 }
      );
    }

    // Convert blob to text
    const svgContent = await data.text();

    // Return SVG content
    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error("Error getting SVG:", error);
    return NextResponse.json(
      { message: "Error fetching SVG" },
      { status: 500 }
    );
  }
}
