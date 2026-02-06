"use client";

import type { Room } from "@/types/room";

interface RoomLegendProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onRoomClick: (pathId: string | null) => void;
}

export default function RoomLegend({
  rooms,
  selectedRoomId,
  onRoomClick,
}: RoomLegendProps) {
  const statusLabels = {
    available: "Tersedia",
    occupied: "Terpakai",
    maintenance: "Maintenance",
  };

  const handleClick = (pathId: string) => {
    // Toggle selection: if already selected, deselect; otherwise select
    if (selectedRoomId === pathId) {
      onRoomClick(null);
    } else {
      onRoomClick(pathId);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 shrink-0">
        Daftar Ruangan ({rooms.length})
      </h3>
      <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
        {rooms.map((room, index) => {
          const isSelected = selectedRoomId === room.path_id;
          return (
            <div
              key={room.id}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                isSelected
                  ? "bg-gray-200 ring-2 ring-gray-400 ring-inset"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleClick(room.path_id)}
            >
              <span className="text-xs text-gray-400 w-5 text-right shrink-0">
                {index + 1}.
              </span>
              <div
                className={`w-4 h-4 rounded shrink-0 border ${
                  isSelected
                    ? "border-gray-500 ring-1 ring-gray-400"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: room.color || "#cccccc" }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isSelected ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {room.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{room.code}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      room.status === "available"
                        ? "bg-gray-200 text-gray-700"
                        : room.status === "occupied"
                          ? "bg-gray-500 text-white"
                          : "bg-gray-400 text-gray-900"
                    }`}
                  >
                    {statusLabels[room.status]}
                  </span>
                </div>
              </div>
              {isSelected && (
                <svg
                  className="w-4 h-4 text-gray-600 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          );
        })}

        {rooms.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Tidak ada data ruangan
          </p>
        )}
      </div>
    </div>
  );
}
