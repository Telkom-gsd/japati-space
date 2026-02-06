"use client";

import Link from "next/link";

interface FloorNavigationProps {
  floors: string[];
  currentFloor: string;
}

export default function FloorNavigation({
  floors,
  currentFloor,
}: FloorNavigationProps) {
  const formatFloorLabel = (floor: string): string => {
    const upper = floor.toUpperCase();
    if (upper.startsWith("LTB")) {
      return `Basement ${upper.replace("LTB", "")}`;
    }
    return `Lantai ${upper.replace("LT", "")}`;
  };

  return (
    <nav className="flex flex-wrap gap-2">
      {floors.map((floor) => {
        const isActive = floor.toLowerCase() === currentFloor.toLowerCase();
        return (
          <Link
            key={floor}
            href={`/lantai/${floor.toLowerCase()}`}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {formatFloorLabel(floor)}
          </Link>
        );
      })}
    </nav>
  );
}
