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

    console.log(`[get-svg] Fetching ${fileName} from Supabase Storage...`);

    // Try to get from Supabase Storage
    const { data, error } = await supabase.storage
      .from("denah")
      .download(fileName);

    if (error) {
      // File not found in storage
      console.log(`[get-svg] Not found in storage: ${fileName}, error: ${error.message}`);
      return new NextResponse(null, {
        status: 404,
        headers: {
          "X-Fallback": "true",
        },
      });
    }

    // Convert blob to text
    const svgContent = await data.text();
    console.log(`[get-svg] Successfully loaded ${fileName} from storage (${svgContent.length} bytes)`);

    // Return SVG content with NO cache to always get fresh data
    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

  } catch (error) {
    console.error("[get-svg] Error:", error);
    return new NextResponse(null, { status: 500 });
  }
}
