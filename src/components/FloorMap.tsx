"use client";

import { useEffect, useRef, useState } from "react";
import type { Room, SVGRoom } from "@/types/room";
import RoomTooltip from "./RoomTooltip";
import RoomDetailModal from "./RoomDetailModal";
import AddRoomModal from "./AddRoomModal";

interface FloorMapProps {
  floor: string;
  rooms: Room[];
  onRoomUpdate: (room: Room) => void;
  onRoomCreate: (room: Partial<Room>) => Promise<Room | null>;
  selectedRoomId: string | null;
  onRoomSelect: (pathId: string | null) => void;
}

export default function FloorMap({
  floor,
  rooms,
  onRoomUpdate,
  onRoomCreate,
  selectedRoomId,
  onRoomSelect,
}: FloorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [svgError, setSvgError] = useState<string | null>(null);
  const [isLoadingSvg, setIsLoadingSvg] = useState(true);
  const svgRoomsRef = useRef<SVGRoom[]>([]);
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [hoveredPathId, setHoveredPathId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [unassignedPathId, setUnassignedPathId] = useState<string | null>(null);
  const [unassignedPathColor, setUnassignedPathColor] =
    useState<string>("#cccccc");

  // Use refs for latest values to avoid stale closures in event listeners
  const roomsRef = useRef(rooms);
  const selectedRoomIdRef = useRef(selectedRoomId);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // Load SVG content
  useEffect(() => {
    const loadSvg = async () => {
      setIsLoadingSvg(true);
      setSvgError(null);
      try {
        const response = await fetch(`/denah/${floor.toUpperCase()}.svg`);
        if (response.ok) {
          const text = await response.text();
          setSvgContent(text);
        } else {
          setSvgError(`File SVG tidak ditemukan: ${floor.toUpperCase()}.svg`);
        }
      } catch (error) {
        console.error("Error loading SVG:", error);
        setSvgError("Gagal memuat file SVG");
      } finally {
        setIsLoadingSvg(false);
      }
    };

    loadSvg();
  }, [floor]);

  // Parse SVG and find room paths
  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = svgContent;

    const svg = container.querySelector("svg");
    if (!svg) return;

    // Make SVG responsive
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.maxWidth = "100%";
    svg.style.height = "auto";

    // Find the "Area Ruangan" layer
    let areaGroup = svg.querySelector('g[inkscape\\:label="Area Ruangan"]');
    if (!areaGroup) {
      const allGroups = svg.querySelectorAll("g");
      for (const g of allGroups) {
        const label = g.getAttribute("inkscape:label");
        if (label === "Area Ruangan") {
          areaGroup = g;
          break;
        }
      }
    }

    if (!areaGroup) {
      console.warn("Area Ruangan layer not found");
      return;
    }

    const paths = areaGroup.querySelectorAll("path");
    const roomElements: SVGRoom[] = [];
    const listeners: Array<{
      path: SVGPathElement;
      type: string;
      handler: EventListener;
    }> = [];

    paths.forEach((path) => {
      const pathId = path.getAttribute("id");
      const style = path.getAttribute("style") || "";
      const fillMatch = style.match(/fill:\s*([^;]+)/);
      const color = fillMatch ? fillMatch[1] : "#cccccc";

      if (pathId) {
        // Store original color
        path.setAttribute("data-original-color", color);

        // Set initial completely invisible style
        path.style.fill = color;
        path.style.opacity = "0";
        path.style.cursor = "pointer";
        path.style.transition = "opacity 0.2s ease";

        roomElements.push({ pathId, color, pathElement: path });

        // Event handlers
        const enterHandler = (e: Event) => {
          const target = e.target as SVGPathElement;
          const room = roomsRef.current.find((r) => r.path_id === pathId);

          // Show color on hover
          target.style.opacity = "0.6";
          setHoveredPathId(pathId);

          if (room) {
            setHoveredRoom(room);
          } else {
            // Unassigned room - show as hoverable
            setHoveredRoom(null);
          }
        };

        const leaveHandler = (e: Event) => {
          const target = e.target as SVGPathElement;
          const currentSelectedId = selectedRoomIdRef.current;

          // Reset opacity based on selection state
          if (currentSelectedId === pathId) {
            target.style.opacity = "0.7";
          } else {
            target.style.opacity = "0";
          }

          setHoveredRoom(null);
          setHoveredPathId(null);
        };

        const moveHandler = (e: Event) => {
          const mouseEvent = e as MouseEvent;
          setTooltipPosition({
            x: mouseEvent.clientX + 15,
            y: mouseEvent.clientY + 15,
          });
        };

        const clickHandler = () => {
          const room = roomsRef.current.find((r) => r.path_id === pathId);
          if (room) {
            setSelectedRoom(room);
            setIsModalOpen(true);
          } else {
            // Unassigned room - open add modal
            setUnassignedPathId(pathId);
            setUnassignedPathColor(color);
            setIsAddModalOpen(true);
          }
        };

        path.addEventListener("mouseenter", enterHandler);
        path.addEventListener("mouseleave", leaveHandler);
        path.addEventListener("mousemove", moveHandler);
        path.addEventListener("click", clickHandler);

        listeners.push({ path, type: "mouseenter", handler: enterHandler });
        listeners.push({ path, type: "mouseleave", handler: leaveHandler });
        listeners.push({ path, type: "mousemove", handler: moveHandler });
        listeners.push({ path, type: "click", handler: clickHandler });
      }
    });

    svgRoomsRef.current = roomElements;

    return () => {
      listeners.forEach(({ path, type, handler }) => {
        path.removeEventListener(type, handler);
      });
    };
  }, [svgContent]);

  // Handle selected room from legend (highlight effect)
  useEffect(() => {
    svgRoomsRef.current.forEach(({ pathId, pathElement }) => {
      if (selectedRoomId === pathId) {
        // Selected: show with higher opacity, no border
        pathElement.style.opacity = "0.7";
        pathElement.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (hoveredPathId !== pathId) {
        // Not selected and not hovered: invisible
        pathElement.style.opacity = "0";
      }
    });
  }, [selectedRoomId, hoveredPathId]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleRoomSave = (updatedRoom: Room) => {
    onRoomUpdate(updatedRoom);
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    setUnassignedPathId(null);
  };

  const handleAddRoom = async (roomData: Partial<Room>) => {
    const newRoom = await onRoomCreate({
      ...roomData,
      path_id: unassignedPathId!,
      floor: floor.toLowerCase(),
      color: unassignedPathColor,
    });
    if (newRoom) {
      setIsAddModalOpen(false);
      setUnassignedPathId(null);
    }
  };

  if (isLoadingSvg) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Memuat peta...</div>
      </div>
    );
  }

  if (svgError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{svgError}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full overflow-auto bg-white"
      />

      {(hoveredRoom || hoveredPathId) && (
        <RoomTooltip
          room={hoveredRoom}
          pathId={hoveredPathId}
          position={tooltipPosition}
        />
      )}

      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleRoomSave}
        />
      )}

      {isAddModalOpen && unassignedPathId && (
        <AddRoomModal
          pathId={unassignedPathId}
          floor={floor}
          color={unassignedPathColor}
          isOpen={isAddModalOpen}
          onClose={handleAddModalClose}
          onSave={handleAddRoom}
        />
      )}
    </div>
  );
}
