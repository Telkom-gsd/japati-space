"use client";

import { useEffect, useState, useCallback, use } from "react";
import type { Room } from "@/types/room";
import FloorMap from "@/components/FloorMap";
import FloorNavigation from "@/components/FloorNavigation";
import RoomLegend from "@/components/RoomLegend";
import SettingsModal from "@/components/SettingsModal";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isAdmin } = useAuth();

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
        {/* Header - Single Row */}
        <div className="border-b border-gray-200 px-3 md:px-4 py-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Left Side - Title */}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base md:text-lg font-semibold text-gray-900 whitespace-nowrap">
                Peta Gedung
              </h1>
              <span className="text-gray-300 hidden sm:block">|</span>
              <span className="text-xs md:text-sm text-gray-500 font-medium hidden sm:block">
                {formatFloorTitle(floor)}
              </span>
            </div>
            
            {/* Center - Floor Navigation */}
            <div className="flex-1 min-w-0 mx-2 overflow-x-auto">
              <div className="flex items-center gap-1">
                <FloorNavigation floors={floors} currentFloor={floor} />
              </div>
            </div>
            
            {/* Right Side - Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && (
                <Link
                  href={`/editor/${floor}`}
                  className="px-2 py-1.5 text-xs md:text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <svg
                    className="w-3.5 h-3.5 md:w-4 md:h-4"
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
                  <span className="hidden lg:inline">Edit</span>
                </Link>
              )}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Pengaturan"
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <UserMenu />
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

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
