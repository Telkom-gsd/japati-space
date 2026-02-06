"use client";

import type { Room } from "@/types/room";

interface RoomTooltipProps {
  room: Room | null;
  pathId: string | null;
  position: { x: number; y: number };
}

export default function RoomTooltip({
  room,
  pathId,
  position,
}: RoomTooltipProps) {
  const statusLabels = {
    available: "Tersedia",
    occupied: "Terpakai",
    maintenance: "Maintenance",
  };

  const statusColors = {
    available: "bg-gray-200 text-gray-800",
    occupied: "bg-gray-600 text-white",
    maintenance: "bg-gray-400 text-gray-900",
  };

  // If no room data, show unassigned tooltip
  if (!room && pathId) {
    return (
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-4 h-4 rounded shrink-0 mt-0.5 border border-gray-300 bg-gray-200" />
            <div>
              <h3 className="font-semibold text-gray-500 text-sm leading-tight">
                Ruangan Belum Di-assign
              </h3>
              <p className="text-xs text-gray-400 font-mono">{pathId}</p>
            </div>
          </div>
          <span className="text-xs text-gray-400 italic">
            Klik untuk menambah data ruangan
          </span>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-start gap-2 mb-2">
          <div
            className="w-4 h-4 rounded shrink-0 mt-0.5 border border-gray-300"
            style={{ backgroundColor: room.color || "#cccccc" }}
          />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {room.name}
            </h3>
            <p className="text-xs text-gray-500">{room.code}</p>
          </div>
        </div>

        {room.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {room.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span
            className={`text-xs px-2 py-0.5 rounded ${statusColors[room.status]}`}
          >
            {statusLabels[room.status]}
          </span>
          <span className="text-xs text-gray-400 italic">
            Klik untuk detail
          </span>
        </div>
      </div>
    </div>
  );
}
