"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const SVGCanvasEditor = dynamic(() => import("@/components/SVGCanvasEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      Memuat editor...
    </div>
  ),
});

interface EditorPageProps {
  params: Promise<{ floor: string }>;
}

async function getAvailableFloors(): Promise<string[]> {
  try {
    const response = await fetch("/api/floors");
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback
  }
  return ["lt1", "lt2", "lt4", "lt6", "lt8"];
}

export default function EditorPage({ params }: EditorPageProps) {
  const { floor } = use(params);
  const [floors, setFloors] = useState<string[]>([]);

  useEffect(() => {
    getAvailableFloors().then(setFloors);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-900">
      <SVGCanvasEditor floor={floor} floors={floors} />
    </div>
  );
}
