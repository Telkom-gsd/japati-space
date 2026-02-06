import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const { floor, svgContent } = await request.json();

    if (!floor || !svgContent) {
      return NextResponse.json(
        { message: "Floor dan svgContent harus disediakan" },
        { status: 400 }
      );
    }

    // Sanitize floor name to prevent path traversal
    const sanitizedFloor = floor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    
    // Path to public/denah folder
    const filePath = join(process.cwd(), "public", "denah", `${sanitizedFloor}.svg`);

    // Write the SVG file
    await writeFile(filePath, svgContent, "utf-8");

    return NextResponse.json({ 
      success: true, 
      message: `SVG ${sanitizedFloor}.svg berhasil disimpan` 
    });

  } catch (error) {
    console.error("Error saving SVG:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan file SVG" },
      { status: 500 }
    );
  }
}
