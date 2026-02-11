"use client";

import { useEffect, useRef, useState } from "react";
import type { Room, SVGRoom } from "@/types/room";
import RoomTooltip from "./RoomTooltip";
import RoomDetailModal from "./RoomDetailModal";
import AddRoomModal from "./AddRoomModal";
import { useAuth } from "@/contexts/AuthContext";

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
  const { isAdmin, loading: authLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [svgError, setSvgError] = useState<string | null>(null);
  const [isLoadingSvg, setIsLoadingSvg] = useState(true);
  const svgRoomsRef = useRef<SVGRoom[]>([]);
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [hoveredPathId, setHoveredPathId] = useState<string | null>(null);
  const [hoveredPathColor, setHoveredPathColor] = useState<string>("#cccccc");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [unassignedPathId, setUnassignedPathId] = useState<string | null>(null);
  const [unassignedPathColor, setUnassignedPathColor] =
    useState<string>("#cccccc");

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });
  const originalViewBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Use refs for latest values to avoid stale closures in event listeners
  const roomsRef = useRef(rooms);
  const selectedRoomIdRef = useRef(selectedRoomId);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // Apply zoom and pan to SVG viewBox
  useEffect(() => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector("svg");
    if (!svg || !originalViewBoxRef.current) return;

    const { x, y, w, h } = originalViewBoxRef.current;
    const newW = w / zoomLevel;
    const newH = h / zoomLevel;
    const cx = x + w / 2 + panOffset.x;
    const cy = y + h / 2 + panOffset.y;
    const newX = cx - newW / 2;
    const newY = cy - newH / 2;

    svg.setAttribute("viewBox", `${newX} ${newY} ${newW} ${newH}`);
  }, [zoomLevel, panOffset]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.3, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = prev / 1.3;
      if (next <= 1.05) {
        setPanOffset({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoomLevel((prev) => Math.min(prev * 1.1, 5));
      } else {
        setZoomLevel((prev) => {
          const next = prev / 1.1;
          if (next <= 1.05) {
            setPanOffset({ x: 0, y: 0 });
            return 1;
          }
          return next;
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Pan handlers
  const handlePanStart = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOffsetStartRef.current = { ...panOffset };
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanningRef.current || !originalViewBoxRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    const container = containerRef.current;
    if (!container) return;

    const { w, h } = originalViewBoxRef.current;
    const rect = container.getBoundingClientRect();
    // Convert screen pixels to SVG units
    const scaleX = w / rect.width / zoomLevel;
    const scaleY = h / rect.height / zoomLevel;

    setPanOffset({
      x: panOffsetStartRef.current.x - dx * scaleX,
      y: panOffsetStartRef.current.y - dy * scaleY,
    });
  };

  const handlePanEnd = () => {
    isPanningRef.current = false;
  };

  // Search rooms - focus on matched room
  const searchResults = searchQuery.trim()
    ? rooms.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.code.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const handleSearchSelect = (room: Room) => {
    onRoomSelect(room.path_id);
    setShowSearch(false);
    setSearchQuery("");

    // Find the SVG path and zoom to it
    const pathEl = svgRoomsRef.current.find((r) => r.pathId === room.path_id);
    if (pathEl?.pathElement && originalViewBoxRef.current) {
      const bbox = pathEl.pathElement.getBBox();
      const padding = Math.max(bbox.width, bbox.height) * 0.5;
      setPanOffset({
        x: bbox.x + bbox.width / 2 - originalViewBoxRef.current.x - originalViewBoxRef.current.w / 2,
        y: bbox.y + bbox.height / 2 - originalViewBoxRef.current.y - originalViewBoxRef.current.h / 2,
      });
      setZoomLevel(3);
    }
  };

  // Load SVG content
  useEffect(() => {
    const loadSvg = async () => {
      setIsLoadingSvg(true);
      setSvgError(null);
      const floorName = floor.toUpperCase();
      
      try {
        // Try Supabase Storage API first
        let response = await fetch(`/api/get-svg/${floorName}`);
        
        // If not found in storage (404), fallback to public folder
        if (response.status === 404) {
          console.log(`SVG not in storage, using public folder: ${floorName}.svg`);
          response = await fetch(`/denah/${floorName}.svg`);
        }
        
        if (response.ok) {
          const text = await response.text();
          setSvgContent(text);
        } else {
          setSvgError(`File SVG tidak ditemukan: ${floorName}.svg`);
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

    // Make SVG fit container while maintaining aspect ratio
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.maxWidth = "100%";
    svg.style.maxHeight = "100%";
    svg.style.objectFit = "contain";

    // Store original viewBox for zoom calculations
    const vb = svg.getAttribute("viewBox");
    if (vb) {
      const parts = vb.split(/[\s,]+/).map(Number);
      if (parts.length === 4) {
        originalViewBoxRef.current = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
      }
    } else {
      // If no viewBox, try to calculate from width/height or bounding box
      const bbox = svg.getBBox();
      originalViewBoxRef.current = { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height };
      svg.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    }

    // Reset zoom when floor changes
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });

    // Helper function to get fill color from element
    const getElementFillColor = (element: Element): string | null => {
      // Check inline style first
      const style = element.getAttribute("style") || "";
      const fillMatch = style.match(/fill:\s*([^;]+)/);
      if (fillMatch && fillMatch[1] !== "none") {
        return fillMatch[1];
      }

      // Check fill attribute
      const fillAttr = element.getAttribute("fill");
      if (fillAttr && fillAttr !== "none") {
        return fillAttr;
      }

      // Check CSS class (for Illustrator SVG)
      const className = element.getAttribute("class");
      if (className && svg) {
        // Try to get computed style
        const computed = window.getComputedStyle(element as SVGElement);
        const computedFill = computed.fill;
        if (computedFill && computedFill !== "none" && computedFill !== "rgb(0, 0, 0)") {
          return computedFill;
        }

        // Parse from style tag in SVG
        const styleTag = svg.querySelector("style");
        if (styleTag) {
          const cssText = styleTag.textContent || "";
          const classNames = className.split(/\s+/);
          for (const cls of classNames) {
            const regex = new RegExp(`\\.${cls}\\s*\\{[^}]*fill:\\s*([^;\\}]+)`, "i");
            const match = cssText.match(regex);
            if (match && match[1] !== "none") {
              return match[1].trim();
            }
          }
        }
      }

      return null;
    };

    // Find the "Area Ruangan" layer (Inkscape format)
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

    const roomElements: SVGRoom[] = [];
    const listeners: Array<{
      path: Element;
      type: string;
      handler: EventListener;
    }> = [];

    // Collection of area elements - support both Inkscape and Illustrator format
    let areaElements: Element[] = [];
    let isIllustratorFormat = false;

    if (areaGroup) {
      // Inkscape format - get paths from Area Ruangan layer
      areaElements = Array.from(areaGroup.querySelectorAll("path"));
    } else {
      // Illustrator format - find polygons, rects, and paths with fill colors
      // These are typically at the end of the SVG for Illustrator exports
      isIllustratorFormat = true;
      const allShapes = svg.querySelectorAll("polygon, rect, path");
      
      allShapes.forEach((element) => {
        const fillColor = getElementFillColor(element);
        // Only include elements with colored fills (not black lines or transparent)
        if (fillColor && fillColor !== "#000" && fillColor !== "#000000" && fillColor !== "black") {
          // Check if it's a closed shape (has some area)
          if (element.tagName === "polygon" || element.tagName === "rect") {
            areaElements.push(element);
          } else if (element.tagName === "path") {
            // For paths, check if it's likely an area (not a line)
            const d = element.getAttribute("d") || "";
            // Area paths typically end with 'z' or 'Z' (closed path)
            if (d.toLowerCase().includes("z")) {
              areaElements.push(element);
            }
          }
        }
      });
      
      console.log(`Found ${areaElements.length} area elements in Illustrator format SVG`);
    }

    if (areaElements.length === 0) {
      console.warn("No area elements found in SVG");
      return;
    }

    // Process each area element (path, polygon, or rect)
    areaElements.forEach((element, index) => {
      // Get or generate ID for the element
      let elementId = element.getAttribute("id");
      if (!elementId) {
        // Generate ID for Illustrator elements that don't have one
        const tagName = element.tagName.toLowerCase();
        elementId = `${floor.toLowerCase()}-${tagName}-${index}`;
        element.setAttribute("id", elementId);
      }

      // Get the fill color
      const color = getElementFillColor(element) || "#cccccc";

      // Store original color
      element.setAttribute("data-original-color", color);

      // Set initial completely invisible style
      const svgElement = element as SVGElement;
      svgElement.style.fill = color;
      svgElement.style.opacity = "0";
      svgElement.style.cursor = "pointer";
      svgElement.style.transition = "opacity 0.2s ease";

      roomElements.push({ pathId: elementId, color, pathElement: element as SVGPathElement });

      // Event handlers
      const enterHandler = (e: Event) => {
        const target = e.target as SVGElement;
        const room = roomsRef.current.find((r) => r.path_id === elementId);

        // Show color on hover
        target.style.opacity = "0.6";
        setHoveredPathId(elementId);
        setHoveredPathColor(color);

        if (room) {
          setHoveredRoom(room);
        } else {
          // Unassigned room - show as hoverable
          setHoveredRoom(null);
        }
      };

      const leaveHandler = (e: Event) => {
        const target = e.target as SVGElement;
        const currentSelectedId = selectedRoomIdRef.current;

        // Reset opacity based on selection state
        if (currentSelectedId === elementId) {
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
        const room = roomsRef.current.find((r) => r.path_id === elementId);
        if (room) {
          setSelectedRoom(room);
          setIsModalOpen(true);
        } else {
          // Unassigned room - open add modal
          setUnassignedPathId(elementId);
          setUnassignedPathColor(color);
          setIsAddModalOpen(true);
        }
      };

      element.addEventListener("mouseenter", enterHandler);
      element.addEventListener("mouseleave", leaveHandler);
      element.addEventListener("mousemove", moveHandler);
      element.addEventListener("click", clickHandler);

      listeners.push({ path: element, type: "mouseenter", handler: enterHandler });
      listeners.push({ path: element, type: "mouseleave", handler: leaveHandler });
      listeners.push({ path: element, type: "mousemove", handler: moveHandler });
      listeners.push({ path: element, type: "click", handler: clickHandler });
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
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center overflow-hidden bg-white [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:object-contain ${zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      />

      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
        {/* Search button */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-9 h-9 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          title="Cari ruangan"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <div className="h-1" />

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 bg-white border border-gray-300 rounded-t-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center text-lg font-bold text-gray-600"
          title="Perbesar"
        >
          +
        </button>

        {/* Zoom level indicator */}
        <button
          onClick={handleZoomReset}
          className="w-9 h-7 bg-white border-x border-gray-300 shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          title="Reset zoom"
        >
          <span className="text-xs text-gray-500">{Math.round(zoomLevel * 100)}%</span>
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 bg-white border border-gray-300 rounded-b-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center text-lg font-bold text-gray-600"
          title="Perkecil"
        >
          −
        </button>
      </div>

      {/* Search Dropdown */}
      {showSearch && (
        <div className="absolute top-3 right-14 z-20 bg-white border border-gray-300 rounded-lg shadow-lg w-64">
          <div className="p-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau kode..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                autoFocus
              />
            </div>
          </div>
          {searchQuery.trim() && (
            <div className="max-h-48 overflow-y-auto border-t border-gray-200">
              {searchResults.length > 0 ? (
                searchResults.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleSearchSelect(room)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded shrink-0 border border-gray-300"
                      style={{ backgroundColor: room.color || "#cccccc" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{room.name}</p>
                      <p className="text-xs text-gray-500">{room.code}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">Tidak ditemukan</p>
              )}
            </div>
          )}
        </div>
      )}

      {(hoveredRoom || hoveredPathId) && (
        <RoomTooltip
          room={hoveredRoom}
          pathId={hoveredPathId}
          position={tooltipPosition}
          pathColor={hoveredPathColor}
        />
      )}

      {selectedRoom && (
        <RoomDetailModal
          key={selectedRoom.id + "-" + selectedRoom.updated_at}
          room={selectedRoom}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleRoomSave}
          readOnly={authLoading || !isAdmin}
        />
      )}

      {isAddModalOpen && unassignedPathId && !authLoading && isAdmin && (
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
