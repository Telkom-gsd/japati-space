"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title?: string;
  showFloorNav?: boolean;
  currentFloor?: number;
  totalFloors?: number;
  onFloorChange?: (floor: number) => void;
}

export default function Header({
  title = "Japati Space",
  showFloorNav = false,
  currentFloor = 1,
  totalFloors = 5,
  onFloorChange,
}: HeaderProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const isEditorPage = pathname?.startsWith("/editor");

  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{title}</h1>
                {isEditorPage && (
                  <span className="text-xs text-orange-400 font-medium">
                    Editor Mode
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Floor Navigation (if enabled) */}
          {showFloorNav && (
            <div className="hidden md:flex items-center gap-2">
              {Array.from({ length: totalFloors }, (_, i) => i + 1).map((floor) => (
                <button
                  key={floor}
                  onClick={() => onFloorChange?.(floor)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentFloor === floor
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  Lantai {floor}
                </button>
              ))}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* View/Edit Toggle for Admin */}
            {isAdmin && !isEditorPage && (
              <Link
                href={`/editor/${currentFloor || 1}`}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Map
              </Link>
            )}

            {/* Back to View Mode for Editor */}
            {isEditorPage && (
              <Link
                href={`/lantai/${currentFloor || 1}`}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View Mode
              </Link>
            )}

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
