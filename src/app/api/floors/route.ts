import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// GET /api/floors - Get available floors from public/denah folder
export async function GET() {
  try {
    const denahDir = path.join(process.cwd(), "public", "denah");
    
    if (!fs.existsSync(denahDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(denahDir);
    const floors = files
      .filter((file) => file.endsWith(".svg"))
      .map((file) => file.replace(".svg", "").toLowerCase())
      .sort((a, b) => {
        // Sort: LTB first (descending), then LT (ascending)
        const aIsBasement = a.startsWith("ltb");
        const bIsBasement = b.startsWith("ltb");

        if (aIsBasement && !bIsBasement) return 1;
        if (!aIsBasement && bIsBasement) return -1;

        const aNum = parseInt(a.replace(/\D/g, ""));
        const bNum = parseInt(b.replace(/\D/g, ""));

        if (aIsBasement && bIsBasement) return bNum - aNum;
        return aNum - bNum;
      });

    return NextResponse.json(floors);
  } catch (error) {
    console.error("Error reading floors:", error);
    return NextResponse.json([]);
  }
}
