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
    <nav className="flex flex-nowrap gap-1">
      {floors.map((floor) => {
        const isActive = floor.toLowerCase() === currentFloor.toLowerCase();
        return (
          <Link
            key={floor}
            href={`/lantai/${floor.toLowerCase()}`}
            className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
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
