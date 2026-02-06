"use client";

import { useEffect, useState, useCallback, use } from "react";
import type { Room } from "@/types/room";
import FloorMap from "@/components/FloorMap";
import FloorNavigation from "@/components/FloorNavigation";
import RoomLegend from "@/components/RoomLegend";
import Link from "next/link";

interface FloorPageProps {
  params: Promise<{ floor: string }>;
}

// Function to get available floors from public/denah folder
async function getAvailableFloors(): Promise<string[]> {
  try {
    const response = await fetch("/api/floors");
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback to default floors if API fails
  }
  return ["lt1", "lt2", "lt4", "lt6", "lt8"];
}

export default function FloorPage({ params }: FloorPageProps) {
  const { floor } = use(params);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Fetch rooms for current floor
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`/api/rooms?floor=${floor.toLowerCase()}`);
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchRooms();
    // Reset selection when floor changes
    setSelectedRoomId(null);
  }, [floor]);

  // Fetch available floors
  useEffect(() => {
    getAvailableFloors().then(setFloors);
  }, []);

  const handleRoomUpdate = useCallback((updatedRoom: Room) => {
    setRooms((prev) =>
      prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room)),
    );
  }, []);

  const handleRoomCreate = useCallback(
    async (roomData: Partial<Room>): Promise<Room | null> => {
      try {
        const response = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomData),
        });
        if (response.ok) {
          const newRoom = await response.json();
          setRooms((prev) => [...prev, newRoom]);
          return newRoom;
        }
      } catch (error) {
        console.error("Error creating room:", error);
      }
      return null;
    },
    [],
  );

  const handleRoomSelect = useCallback((pathId: string | null) => {
    setSelectedRoomId(pathId);
  }, []);

  const formatFloorTitle = (floor: string): string => {
    const upper = floor.toUpperCase();
    if (upper.startsWith("LTB")) {
      return `Basement ${upper.replace("LTB", "")}`;
    }
    return `Lantai ${upper.replace("LT", "")}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-4">
      {/* Unified Container */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-480 mx-auto h-[calc(100vh-16px)] md:h-[calc(100vh-32px)] flex flex-col">
        {/* Header with Navigation */}
        <div className="border-b border-gray-200 px-4 md:px-6 py-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-4">
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                Peta Gedung
              </h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 font-medium">
                {formatFloorTitle(floor)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <FloorNavigation floors={floors} currentFloor={floor} />
              <Link
                href={`/editor/${floor}`}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Denah
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Map Area - Takes most space */}
          <div className="flex-1 min-h-0 border-b lg:border-b-0 lg:border-r border-gray-200 flex items-center justify-center p-2 md:p-4 overflow-hidden">
            <FloorMap
              floor={floor}
              rooms={rooms}
              onRoomUpdate={handleRoomUpdate}
              onRoomCreate={handleRoomCreate}
              selectedRoomId={selectedRoomId}
              onRoomSelect={handleRoomSelect}
            />
          </div>

          {/* Legend Sidebar */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 p-4 bg-gray-50 overflow-y-auto max-h-60 lg:max-h-none">
            <RoomLegend
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onRoomClick={handleRoomSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
