"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import Link from "next/link";

interface SVGCanvasEditorProps {
  floor: string;
  floors: string[];
}

interface PathInfo {
  id: string;
  color: string;
  opacity: number;
  layer: L.Polygon | L.Polyline;
  selected?: boolean;
}

interface HistoryState {
  paths: Array<{
    id: string;
    latlngs: L.LatLng[][];
    options: L.PathOptions & { id?: string };
  }>;
}

type ToolMode = "pan" | "select" | "polygon" | "rectangle" | "polyline";

// Custom CSS for cursors
const cursorStyles = `
  .cursor-pan { cursor: grab !important; }
  .cursor-pan:active { cursor: grabbing !important; }
  .cursor-select { cursor: pointer !important; }
  .cursor-polygon { cursor: crosshair !important; }
  .cursor-rectangle { cursor: crosshair !important; }
  .cursor-polyline { cursor: crosshair !important; }
  .cursor-move { cursor: move !important; }
`;

export default function SVGCanvasEditor({
  floor,
  floors,
}: SVGCanvasEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>("pan");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [selectedOpacity, setSelectedOpacity] = useState(0.5);
  const [selectedLayer, setSelectedLayer] = useState<
    L.Polygon | L.Polyline | null
  >(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [paths, setPaths] = useState<PathInfo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({
    x: 0,
    y: 0,
  });

  // Multi-select state
  const [multiSelectedLayers, setMultiSelectedLayers] = useState<Set<L.Polygon | L.Polyline>>(new Set());
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  // History for undo
  const historyRef = useRef<HistoryState[]>([]);
  const historyIndexRef = useRef(-1);

  // Polygon drawing state
  const polygonPointsRef = useRef<L.LatLng[]>([]);
  const tempMarkersRef = useRef<L.CircleMarker[]>([]);
  const tempLinesRef = useRef<L.Polyline[]>([]);
  const isCtrlPressedRef = useRef(false);
  const lastPointRef = useRef<L.LatLng | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentDrawHandlerRef = useRef<any>(null);
  const isDraggingLayerRef = useRef(false);
  const dragStartLatLngRef = useRef<L.LatLng | null>(null);

  const DEFAULT_ZOOM = 0;
  const svgBoundsRef = useRef<L.LatLngBounds | null>(null);
  const svgHeightRef = useRef(800);
  const svgWidthRef = useRef(1000);
  const originalSvgDocRef = useRef<Document | null>(null);
  const svgOverlayRef = useRef<L.ImageOverlay | null>(null);
  const currentSvgUrlRef = useRef<string | null>(null);

  // Reliable helper to find the "Area Ruangan" <g> in any SVG document/clone.
  // CSS selectors with namespace colons can silently fail on cloned docs,
  // so we always iterate manually.
  const findAreaRuanganGroup = (doc: Document): Element | null => {
    const groups = doc.querySelectorAll("g");
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (
        g.getAttribute("inkscape:label") === "Area Ruangan" ||
        g.getAttributeNS("http://www.inkscape.org/namespaces/inkscape", "label") === "Area Ruangan"
      ) {
        return g;
      }
    }
    return null;
  };

  // Clean up duplicate paths in a SVG document's Area Ruangan group
  // This modifies the document in place and returns the number of duplicates removed
  const cleanupDuplicatePaths = (doc: Document): number => {
    const areaGroup = findAreaRuanganGroup(doc);
    if (!areaGroup) return 0;

    const pathElements = Array.from(areaGroup.querySelectorAll("path"));
    const seenBaseIds = new Set<string>();
    const seenGeometries = new Set<string>();
    let removedCount = 0;

    pathElements.forEach((pathEl) => {
      const rawId = pathEl.getAttribute("id") || "";
      const d = pathEl.getAttribute("d") || "";
      
      // Get base ID (strip suffixes)
      const baseId = rawId.replace(/_dup\d+/g, "").replace(/_\d+$/g, "");
      
      // Create geometry signature (normalized)
      const geometrySig = d.replace(/\s+/g, " ").trim();
      
      // Check for duplicates
      const isDuplicateId = seenBaseIds.has(baseId);
      const isDuplicateGeometry = seenGeometries.has(geometrySig);
      
      if (isDuplicateId || isDuplicateGeometry) {
        // Remove this duplicate path
        pathEl.remove();
        removedCount++;
        console.log(`[SVG Cleanup] Removed duplicate: ${rawId} (baseId: ${baseId})`);
      } else {
        // Keep this path, update its ID to base ID
        seenBaseIds.add(baseId);
        seenGeometries.add(geometrySig);
        
        // Normalize the ID to base ID (remove suffixes)
        if (rawId !== baseId) {
          pathEl.setAttribute("id", baseId);
        }
      }
    });

    console.log(`[SVG Cleanup] Removed ${removedCount} duplicates, kept ${seenBaseIds.size} unique paths`);
    return removedCount;
  };

  // Generate path elements string from current Leaflet layers
  const generatePathsString = useCallback((): string => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems) return "";

    const pathStrings: string[] = [];
    const usedIds = new Set<string>();

    drawnItems.eachLayer((layer) => {
      if ((layer as L.Polygon).getLatLngs) {
        const polygon = layer as L.Polygon;
        const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
        const options = polygon.options as L.PathOptions & { id?: string };
        
        // Get ID, use original or generate new
        let id = options.id || `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Clean ALL suffixes to get the base ID (prevents accumulation like path6615_1_1_1)
        // Remove: _dup1, _1, _2, etc.
        const baseId = id.replace(/_dup\d+/g, "").replace(/_\d+$/g, "");
        
        // Use base ID if available, otherwise make unique
        let uniqueId = baseId;
        if (usedIds.has(baseId)) {
          // This shouldn't happen normally since load dedupe prevents duplicates
          // But just in case, generate a truly unique ID
          let counter = 1;
          while (usedIds.has(uniqueId)) {
            uniqueId = `${baseId}_${counter++}`;
          }
        }
        usedIds.add(uniqueId);
        
        // Also update the layer's option ID so it stays consistent
        options.id = uniqueId;

        const pathD =
          latlngs
            .map((ll, i) => {
              const x = ll.lng;
              const y = svgHeightRef.current - ll.lat;
              return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(" ") + " Z";

        pathStrings.push(
          `<path id="${uniqueId}" d="${pathD}" style="fill:${options.fillColor || "#cccccc"};fill-opacity:${options.fillOpacity || 0.5};stroke:#000000;stroke-width:1"/>`
        );
      }
    });

    return pathStrings.join("");
  }, []);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems) return;

    const state: HistoryState = { paths: [] };
    drawnItems.eachLayer((layer) => {
      if ((layer as L.Polygon).getLatLngs) {
        const polygon = layer as L.Polygon;
        const options = polygon.options as L.PathOptions & { id?: string };
        state.paths.push({
          id: options.id || `path_${Date.now()}`,
          latlngs: polygon.getLatLngs() as L.LatLng[][],
          options: { ...options },
        });
      }
    });

    // Remove future states if we're not at the end
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );
    historyRef.current.push(state);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  // Refresh paths list
  const refreshPathsList = useCallback(() => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems) return;

    const pathInfos: PathInfo[] = [];
    drawnItems.eachLayer((layer) => {
      const options = (layer as L.Path).options as L.PathOptions & {
        id?: string;
      };
      const id = options.id || `path_${pathInfos.length}`;
      pathInfos.push({
        id,
        color: (options.fillColor as string) || "#cccccc",
        opacity: options.fillOpacity || 0.5,
        layer: layer as L.Polygon,
      });
    });
    setPaths(pathInfos);
  }, []);

  // Refresh SVG overlay to reflect current polygon state
  // The background SVG has "Area Ruangan" hidden — we keep it that way
  // because Leaflet polygon layers are the visual source of truth
  const refreshSvgOverlay = useCallback(() => {
    // No-op: the background overlay intentionally hides "Area Ruangan"
    // and all polygon rendering is handled by Leaflet layers.
    // This avoids visual duplication between overlay and drawn layers.
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;

    historyIndexRef.current--;
    const state = historyRef.current[historyIndexRef.current];
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems || !state) return;

    // Clear all layers
    drawnItems.clearLayers();

    // Restore from history
    state.paths.forEach((pathData) => {
      const polygon = L.polygon(pathData.latlngs, pathData.options);
      drawnItems.addLayer(polygon);
    });

    refreshPathsList();
    refreshSvgOverlay();
    setSelectedLayer(null);
    setSelectedPathId(null);
  }, [refreshPathsList, refreshSvgOverlay]);

  // Highlight selected layer
  const highlightLayer = useCallback((layer: L.Polygon | L.Polyline | null) => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems) return;

    // Reset all layers
    drawnItems.eachLayer((l) => {
      const path = l as L.Path;
      const options = path.options as L.PathOptions & { id?: string };
      path.setStyle({
        weight: 2,
        dashArray: undefined,
        color: "#000000",
      });
      // Keep original opacity
      if (options.fillOpacity !== undefined) {
        path.setStyle({ fillOpacity: options.fillOpacity });
      }
    });

    // Highlight selected
    if (layer) {
      (layer as L.Path).setStyle({
        weight: 4,
        dashArray: "8, 4",
        color: "#ff6600",
      });
      layer.bringToFront();
    }
  }, []);

  // Format floor title
  const formatFloorTitle = (floor: string): string => {
    const upper = floor.toUpperCase();
    if (upper.startsWith("LTB")) {
      return `Basement ${upper.replace("LTB", "")}`;
    }
    return `Lantai ${upper.replace("LT", "")}`;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Inject cursor styles
    const styleEl = document.createElement("style");
    styleEl.textContent = cursorStyles;
    document.head.appendChild(styleEl);

    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 4,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false, // IMPORTANT: Disable default double-click zoom to prevent conflicts
    });

    mapRef.current = map;

    // Track zoom level
    map.on("zoomend", () => {
      setZoomLevel(map.getZoom());
    });

    // Create feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Load SVG
    loadSVGContent(floor);

    return () => {
      styleEl.remove();
      // Clear drawnItems before removing map
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }
      map.remove();
      mapRef.current = null;
      drawnItemsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floor]);

  // Handle delete
  const handleDeleteSelected = useCallback(() => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems) return;

    // If multi-select has items, delete those
    if (multiSelectedLayers.size > 0) {
      saveToHistory();
      multiSelectedLayers.forEach((layer) => {
        drawnItems.removeLayer(layer);
      });
      setMultiSelectedLayers(new Set());
      setMultiSelectedIds(new Set());
      setSelectAllChecked(false);
      setSelectedLayer(null);
      setSelectedPathId(null);
      setShowColorPicker(false);
      refreshPathsList();
      highlightLayer(null);
      return;
    }

    // Otherwise delete single selected
    if (!selectedLayer) return;

    saveToHistory();
    drawnItems.removeLayer(selectedLayer);
    setSelectedLayer(null);
    setSelectedPathId(null);
    setShowColorPicker(false);
    refreshPathsList();
    highlightLayer(null);
  }, [selectedLayer, multiSelectedLayers, saveToHistory, refreshPathsList, highlightLayer]);

  // Toggle multi-select for a path (used by checkbox in path list)
  const toggleMultiSelect = useCallback((pathInfo: PathInfo, isChecked: boolean) => {
    setMultiSelectedLayers((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(pathInfo.layer);
      } else {
        next.delete(pathInfo.layer);
      }
      return next;
    });
    setMultiSelectedIds((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(pathInfo.id);
      } else {
        next.delete(pathInfo.id);
      }
      return next;
    });

    // Highlight multi-selected layers
    const drawnItems = drawnItemsRef.current;
    if (drawnItems) {
      const path = pathInfo.layer as L.Path;
      if (isChecked) {
        path.setStyle({ weight: 3, dashArray: "6, 3", color: "#ff3333" });
      } else {
        path.setStyle({ weight: 2, dashArray: undefined, color: "#000000" });
      }
    }
  }, []);

  // Select / deselect all paths
  const toggleSelectAll = useCallback((checked: boolean) => {
    setSelectAllChecked(checked);
    if (checked) {
      const allLayers = new Set<L.Polygon | L.Polyline>();
      const allIds = new Set<string>();
      paths.forEach((p) => {
        allLayers.add(p.layer);
        allIds.add(p.id);
        (p.layer as L.Path).setStyle({ weight: 3, dashArray: "6, 3", color: "#ff3333" });
      });
      setMultiSelectedLayers(allLayers);
      setMultiSelectedIds(allIds);
    } else {
      paths.forEach((p) => {
        (p.layer as L.Path).setStyle({ weight: 2, dashArray: undefined, color: "#000000" });
      });
      setMultiSelectedLayers(new Set());
      setMultiSelectedIds(new Set());
    }
  }, [paths]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        isCtrlPressedRef.current = true;
      }
      if (e.key === "Escape") {
        // Cancel current drawing
        clearTempDrawing();
        setToolMode("pan");
        setSelectedLayer(null);
        setSelectedPathId(null);
        highlightLayer(null);
        setShowColorPicker(false);
      }
      if (e.key === "z" && e.ctrlKey) {
        e.preventDefault();
        handleUndo();
      }
      if (e.key === "Delete" && (selectedLayer || multiSelectedLayers.size > 0)) {
        handleDeleteSelected();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        isCtrlPressedRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedLayer, multiSelectedLayers, handleUndo, highlightLayer, handleDeleteSelected]);

  // Handle tool mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear temp drawing
    clearTempDrawing();

    // Disable current handler
    if (currentDrawHandlerRef.current) {
      currentDrawHandlerRef.current.disable();
      currentDrawHandlerRef.current = null;
    }

    // Update map container cursor class
    const container = map.getContainer();
    container.classList.remove(
      "cursor-pan",
      "cursor-select",
      "cursor-polygon",
      "cursor-rectangle",
      "cursor-polyline",
      "cursor-move",
    );

    if (toolMode === "pan") {
      map.dragging.enable();
      container.classList.add("cursor-pan");
    } else if (toolMode === "select") {
      map.dragging.disable();
      container.classList.add("cursor-select");
    } else if (toolMode === "polygon") {
      map.dragging.disable();
      container.classList.add("cursor-polygon");
    } else if (toolMode === "rectangle") {
      map.dragging.disable();
      container.classList.add("cursor-rectangle");
      // Use Leaflet.Draw rectangle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = new (L.Draw as any).Rectangle(map, {
        shapeOptions: {
          color: "#000000",
          weight: 2,
          fillColor: selectedColor,
          fillOpacity: selectedOpacity,
        },
      });
      handler.enable();
      currentDrawHandlerRef.current = handler;
    } else if (toolMode === "polyline") {
      map.dragging.disable();
      container.classList.add("cursor-polyline");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = new (L.Draw as any).Polyline(map, {
        shapeOptions: {
          color: selectedColor,
          weight: 3,
        },
      });
      handler.enable();
      currentDrawHandlerRef.current = handler;
    }
  }, [toolMode, selectedColor, selectedOpacity]);

  // Clear temporary drawing elements
  const clearTempDrawing = () => {
    const map = mapRef.current;
    if (!map) return;

    tempMarkersRef.current.forEach((m) => map.removeLayer(m));
    tempMarkersRef.current = [];
    tempLinesRef.current.forEach((l) => map.removeLayer(l));
    tempLinesRef.current = [];
    polygonPointsRef.current = [];
    lastPointRef.current = null;
  };

  // Handle map click for polygon drawing
  useEffect(() => {
    const map = mapRef.current;
    const drawnItems = drawnItemsRef.current;
    if (!map || !drawnItems) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (toolMode === "polygon") {
        let point = e.latlng;

        // Axis lock when Ctrl is pressed
        if (isCtrlPressedRef.current && lastPointRef.current) {
          const lastPoint = lastPointRef.current;
          const dx = Math.abs(point.lng - lastPoint.lng);
          const dy = Math.abs(point.lat - lastPoint.lat);

          if (dx > dy) {
            // Lock to X axis (horizontal)
            point = L.latLng(lastPoint.lat, point.lng);
          } else {
            // Lock to Y axis (vertical)
            point = L.latLng(point.lat, lastPoint.lng);
          }
        }

        polygonPointsRef.current.push(point);
        lastPointRef.current = point;

        // Add marker
        const marker = L.circleMarker(point, {
          radius: 6,
          fillColor: selectedColor,
          fillOpacity: 1,
          color: "#ffffff",
          weight: 2,
        }).addTo(map);
        tempMarkersRef.current.push(marker);

        // Add line from previous point
        if (polygonPointsRef.current.length > 1) {
          const points = polygonPointsRef.current;
          const line = L.polyline(
            [points[points.length - 2], points[points.length - 1]],
            {
              color: selectedColor,
              weight: 2,
              dashArray: "5, 5",
            },
          ).addTo(map);
          tempLinesRef.current.push(line);
        }
      } else if (toolMode === "select" || toolMode === "pan") {
        // Check if clicked on a layer
        let clickedLayer: L.Polygon | L.Polyline | null = null;
        drawnItems.eachLayer((layer) => {
          const polygon = layer as L.Polygon;
          if (polygon.getBounds && polygon.getBounds().contains(e.latlng)) {
            // More precise check using point in polygon
            const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
            if (isPointInPolygon(e.latlng, latlngs)) {
              clickedLayer = polygon;
            }
          }
        });

        if (clickedLayer) {
          setSelectedLayer(clickedLayer);
          const options = (clickedLayer as L.Path).options as L.PathOptions & {
            id?: string;
          };
          setSelectedPathId(options.id || null);
          highlightLayer(clickedLayer);
          setToolMode("select");

          // Show color picker near mouse
          setSelectedColor((options.fillColor as string) || "#3b82f6");
          setSelectedOpacity(options.fillOpacity || 0.5);
          setColorPickerPosition({
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
          setShowColorPicker(true);

          // Prepare for dragging
          map.getContainer().classList.add("cursor-move");
        } else if (toolMode === "select") {
          setSelectedLayer(null);
          setSelectedPathId(null);
          highlightLayer(null);
          setShowColorPicker(false);
        }
      }
    };

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      if (toolMode === "polygon" && polygonPointsRef.current.length >= 3) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();

        // Capture points and immediately clear to prevent double execution
        const pointsToUse = [...polygonPointsRef.current];
        polygonPointsRef.current = []; // Clear immediately
        
        // Create polygon
        saveToHistory();
        const polygon = L.polygon(pointsToUse, {
          color: "#000000",
          weight: 2,
          fillColor: selectedColor,
          fillOpacity: selectedOpacity,
        });

        const id = `path_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        (polygon.options as L.PathOptions & { id?: string }).id = id;

        drawnItems.addLayer(polygon);
        clearTempDrawing();
        refreshPathsList();

        console.log(`[Polygon Create] Created polygon with id: ${id}, total layers: ${drawnItems.getLayers().length}`);

        // Select the new polygon
        setSelectedLayer(polygon);
        setSelectedPathId(id);
        highlightLayer(polygon);
        setToolMode("select");
      }
    };

    // Handle draw:created for rectangle/polyline
    const handleCreated = (e: L.LeafletEvent) => {
      const drawEvent = e as L.DrawEvents.Created;
      const layer = drawEvent.layer as L.Polygon | L.Polyline;

      saveToHistory();
      const id = `path_${Date.now()}`;
      (layer.options as L.PathOptions & { id?: string }).id = id;

      drawnItems.addLayer(layer);
      refreshPathsList();

      setSelectedLayer(layer);
      setSelectedPathId(id);
      highlightLayer(layer);
      setToolMode("select");
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDblClick);
    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.off("click", handleClick);
      map.off("dblclick", handleDblClick);
      map.off(L.Draw.Event.CREATED, handleCreated);
    };
  }, [
    toolMode,
    selectedColor,
    selectedOpacity,
    saveToHistory,
    refreshPathsList,
    highlightLayer,
  ]);

  // Handle layer dragging
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLayer) return;

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      if (toolMode !== "select" || !selectedLayer) return;

      const latlngs = (
        selectedLayer as L.Polygon
      ).getLatLngs()[0] as L.LatLng[];
      if (isPointInPolygon(e.latlng, latlngs)) {
        isDraggingLayerRef.current = true;
        dragStartLatLngRef.current = e.latlng;
        map.dragging.disable();
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (
        !isDraggingLayerRef.current ||
        !selectedLayer ||
        !dragStartLatLngRef.current
      )
        return;

      const dx = e.latlng.lng - dragStartLatLngRef.current.lng;
      const dy = e.latlng.lat - dragStartLatLngRef.current.lat;

      const latlngs = (
        selectedLayer as L.Polygon
      ).getLatLngs()[0] as L.LatLng[];
      const newLatLngs = latlngs.map((ll) =>
        L.latLng(ll.lat + dy, ll.lng + dx),
      );

      (selectedLayer as L.Polygon).setLatLngs([newLatLngs]);
      dragStartLatLngRef.current = e.latlng;
    };

    const handleMouseUp = () => {
      if (isDraggingLayerRef.current) {
        isDraggingLayerRef.current = false;
        dragStartLatLngRef.current = null;
        saveToHistory();
      }
    };

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
    };
  }, [selectedLayer, toolMode, saveToHistory]);

  // Point in polygon check
  const isPointInPolygon = (point: L.LatLng, polygon: L.LatLng[]): boolean => {
    let inside = false;
    const x = point.lng,
      y = point.lat;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng,
        yi = polygon[i].lat;
      const xj = polygon[j].lng,
        yj = polygon[j].lat;

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  };

  // Load SVG content
  const loadSVGContent = async (floorName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/denah/${floorName.toUpperCase()}.svg`);
      if (!response.ok) {
        throw new Error(
          `File SVG tidak ditemukan: ${floorName.toUpperCase()}.svg`,
        );
      }

      const svgText = await response.text();
      const map = mapRef.current;
      const drawnItems = drawnItemsRef.current;
      if (!map || !drawnItems) return;

      // CRITICAL: Clear any existing layers before loading new ones
      drawnItems.clearLayers();
      console.log("[SVG Load] Cleared existing drawnItems layers");

      // Parse SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgElement = svgDoc.querySelector("svg");

      if (!svgElement) {
        throw new Error("Invalid SVG file");
      }

      // CRITICAL: Clean up any duplicate paths in the document FIRST
      // This ensures originalSvgDocRef always has a clean document
      const removedDuplicates = cleanupDuplicatePaths(svgDoc);
      if (removedDuplicates > 0) {
        console.log(`[SVG Load] Cleaned ${removedDuplicates} duplicate paths from source`);
      }

      // Store the CLEANED SVG document for later saving
      originalSvgDocRef.current = svgDoc;

      // Get dimensions
      const viewBox = svgElement.getAttribute("viewBox");
      let width = 1000;
      let height = 800;

      if (viewBox) {
        const parts = viewBox.split(/\s+|,/).map(Number);
        if (parts.length >= 4) {
          width = parts[2];
          height = parts[3];
        }
      } else {
        width = parseFloat(svgElement.getAttribute("width") || "1000");
        height = parseFloat(svgElement.getAttribute("height") || "800");
      }

      svgHeightRef.current = height;
      svgWidthRef.current = width;
      const bounds: L.LatLngBoundsExpression = [
        [0, 0],
        [height, width],
      ];
      svgBoundsRef.current = L.latLngBounds(bounds);

      // Extract paths from "Area Ruangan" layer BEFORE creating the overlay
      const areaGroup = findAreaRuanganGroup(svgDoc);

      // Hide "Area Ruangan" from the background overlay to prevent visual duplication
      // The polygons will be rendered as Leaflet layers instead
      if (areaGroup) {
        (areaGroup as Element).setAttribute("style", "display:none");
      }

      // Add SVG (with Area Ruangan hidden) as background image overlay
      const serializer = new XMLSerializer();
      const bgSvgContent = serializer.serializeToString(svgDoc);
      const svgBlob = new Blob([bgSvgContent], { type: "image/svg+xml" });
      const svgUrl = URL.createObjectURL(svgBlob);
      currentSvgUrlRef.current = svgUrl;
      const overlay = L.imageOverlay(svgUrl, bounds).addTo(map);
      svgOverlayRef.current = overlay;
      map.fitBounds(bounds);
      setZoomLevel(map.getZoom());

      // Restore the hidden attribute on the original doc (so saves still work correctly)
      if (areaGroup) {
        (areaGroup as Element).removeAttribute("style");
      }

      // Now load paths as Leaflet polygon layers (they are the only visible copy)
      if (areaGroup) {
        const pathElements = areaGroup.querySelectorAll("path");
        
        // AGGRESSIVE DEDUPLICATION:
        // Track by exact raw ID (handles duplicates with same ID)
        const loadedExactIds = new Set<string>();
        // Track by base ID (handles _dup suffixes)
        const loadedBaseIds = new Set<string>();
        // Track by geometry signature (handles renamed duplicates)
        const seenPathSignatures = new Set<string>();

        console.log(`[SVG Load] Found ${pathElements.length} path elements in Area Ruangan`);

        pathElements.forEach((pathEl, index) => {
          const rawId = pathEl.getAttribute("id") || `imported_${index}`;

          // Skip if we already loaded a path with this EXACT ID
          if (loadedExactIds.has(rawId)) {
            console.log(`[SVG Load] Skipping duplicate exact ID: ${rawId}`);
            return;
          }

          // Extract the base ID (strip _dupN and _N suffixes)
          const baseId = rawId.replace(/_dup\d+/g, "").replace(/_\d+$/g, "");

          // Skip if we already loaded a polygon with this base ID
          if (loadedBaseIds.has(baseId)) {
            console.log(`[SVG Load] Skipping duplicate base ID: ${rawId} (base: ${baseId})`);
            return;
          }

          const d = pathEl.getAttribute("d");
          if (!d) return;

          const style = pathEl.getAttribute("style") || "";
          const fillMatch = style.match(/fill:\s*([^;]+)/);
          const opacityMatch =
            style.match(/fill-opacity:\s*([^;]+)/) ||
            style.match(/opacity:\s*([^;]+)/);
          const color = fillMatch ? fillMatch[1].trim() : "#cccccc";
          const opacity = opacityMatch ? parseFloat(opacityMatch[1]) : 0.6;

          const points = parseSVGPath(d, height);
          if (points.length >= 3) {
            // Create a geometry signature to detect exact coordinate duplicates
            // Using higher precision to catch nearly-identical paths
            const signature = points
              .map((p) => `${Math.round(p.lat * 100)},${Math.round(p.lng * 100)}`)
              .join("|");

            if (seenPathSignatures.has(signature)) {
              console.log(`[SVG Load] Skipping geometry duplicate: ${rawId}`);
              return; // Skip geometry duplicate
            }
            
            // Mark all tracking sets
            loadedExactIds.add(rawId);
            loadedBaseIds.add(baseId);
            seenPathSignatures.add(signature);

            const polygon = L.polygon(points, {
              color: "#000000",
              weight: 2,
              fillColor: color,
              fillOpacity: opacity,
            });

            // Use the base ID (cleaned) as the polygon ID to avoid duplicate suffixes accumulating
            (polygon.options as L.PathOptions & { id?: string }).id = baseId;
            drawnItems.addLayer(polygon);
          }
        });

        console.log(`[SVG Load] Loaded ${drawnItems.getLayers().length} unique polygons`);
        refreshPathsList();
        saveToHistory();
      }
    } catch (err) {
      console.error("Error loading SVG:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat SVG");
    } finally {
      setIsLoading(false);
    }
  };

  // Parse SVG path
  const parseSVGPath = (d: string, svgHeight: number): L.LatLng[] => {
    const points: L.LatLng[] = [];
    const commands =
      d.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g) || [];

    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;

    commands.forEach((cmd) => {
      const type = cmd[0];
      const coords = cmd
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number)
        .filter((n) => !isNaN(n));

      switch (type) {
        case "M":
          for (let i = 0; i < coords.length; i += 2) {
            if (coords[i] !== undefined && coords[i + 1] !== undefined) {
              currentX = coords[i];
              currentY = coords[i + 1];
              if (i === 0) {
                startX = currentX;
                startY = currentY;
              }
              points.push(L.latLng(svgHeight - currentY, currentX));
            }
          }
          break;
        case "L":
          for (let i = 0; i < coords.length; i += 2) {
            if (coords[i] !== undefined && coords[i + 1] !== undefined) {
              currentX = coords[i];
              currentY = coords[i + 1];
              points.push(L.latLng(svgHeight - currentY, currentX));
            }
          }
          break;
        case "m":
          for (let i = 0; i < coords.length; i += 2) {
            if (coords[i] !== undefined && coords[i + 1] !== undefined) {
              currentX += coords[i];
              currentY += coords[i + 1];
              if (i === 0) {
                startX = currentX;
                startY = currentY;
              }
              points.push(L.latLng(svgHeight - currentY, currentX));
            }
          }
          break;
        case "l":
          for (let i = 0; i < coords.length; i += 2) {
            if (coords[i] !== undefined && coords[i + 1] !== undefined) {
              currentX += coords[i];
              currentY += coords[i + 1];
              points.push(L.latLng(svgHeight - currentY, currentX));
            }
          }
          break;
        case "H":
          coords.forEach((x) => {
            currentX = x;
            points.push(L.latLng(svgHeight - currentY, currentX));
          });
          break;
        case "h":
          coords.forEach((dx) => {
            currentX += dx;
            points.push(L.latLng(svgHeight - currentY, currentX));
          });
          break;
        case "V":
          coords.forEach((y) => {
            currentY = y;
            points.push(L.latLng(svgHeight - currentY, currentX));
          });
          break;
        case "v":
          coords.forEach((dy) => {
            currentY += dy;
            points.push(L.latLng(svgHeight - currentY, currentX));
          });
          break;
        case "Z":
        case "z":
          currentX = startX;
          currentY = startY;
          break;
      }
    });

    return points;
  };

  // Apply color instantly
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (selectedLayer) {
      (selectedLayer as L.Path).setStyle({ fillColor: color });
      const options = (selectedLayer as L.Path).options as L.PathOptions & {
        id?: string;
      };
      options.fillColor = color;
      refreshPathsList();
    }
  };

  // Apply opacity instantly
  const handleOpacityChange = (opacity: number) => {
    setSelectedOpacity(opacity);
    if (selectedLayer) {
      (selectedLayer as L.Path).setStyle({ fillOpacity: opacity });
      const options = (selectedLayer as L.Path).options as L.PathOptions & {
        id?: string;
      };
      options.fillOpacity = opacity;
      refreshPathsList();
    }
  };

  // Bring to front/back
  const handleBringToFront = () => {
    if (selectedLayer) {
      selectedLayer.bringToFront();
      saveToHistory();
    }
  };

  const handleSendToBack = () => {
    if (selectedLayer) {
      selectedLayer.bringToBack();
      saveToHistory();
    }
  };

  // Handle path click from list
  const handlePathClick = (pathInfo: PathInfo) => {
    const map = mapRef.current;
    if (!map) return;

    // Reset zoom first
    map.setZoom(DEFAULT_ZOOM);

    // Then navigate to the path
    setTimeout(() => {
      const bounds = pathInfo.layer.getBounds();
      map.panTo(bounds.getCenter());

      setSelectedLayer(pathInfo.layer);
      setSelectedPathId(pathInfo.id);
      highlightLayer(pathInfo.layer);
      setToolMode("select");

      const options = pathInfo.layer.options as L.PathOptions & { id?: string };
      setSelectedColor((options.fillColor as string) || "#3b82f6");
      setSelectedOpacity(options.fillOpacity || 0.5);
    }, 100);
  };

  // Zoom controls
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetView = () => {
    const map = mapRef.current;
    if (map && svgBoundsRef.current) {
      map.fitBounds(svgBoundsRef.current);
    }
  };

  // Save SVG - uses DOM-based approach for reliable manipulation
  const handleSaveSVG = async () => {
    const drawnItems = drawnItemsRef.current;
    const originalDoc = originalSvgDocRef.current;
    if (!drawnItems) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      let svgContent: string;

      if (originalDoc) {
        // Clone the document to work with
        const workingDoc = originalDoc.cloneNode(true) as Document;
        const svgElement = workingDoc.querySelector("svg");
        
        if (!svgElement) {
          throw new Error("SVG element not found in document");
        }

        // Find or create Area Ruangan group
        let areaGroup = findAreaRuanganGroup(workingDoc);
        
        if (!areaGroup) {
          // Create new Area Ruangan group
          areaGroup = workingDoc.createElementNS("http://www.w3.org/2000/svg", "g");
          areaGroup.setAttribute("inkscape:label", "Area Ruangan");
          areaGroup.setAttribute("id", "layer_area_ruangan");
          svgElement.appendChild(areaGroup);
          console.log("[SVG Save] Created new Area Ruangan group");
        } else {
          // Clear ALL existing content in the group
          while (areaGroup.firstChild) {
            areaGroup.removeChild(areaGroup.firstChild);
          }
          console.log("[SVG Save] Cleared existing Area Ruangan content");
        }

        // Add current Leaflet layers as new path elements
        // With DEDUPLICATION based on geometry signature
        const usedIds = new Set<string>();
        const seenGeometries = new Set<string>();
        let pathCount = 0;
        let skippedDuplicates = 0;

        drawnItems.eachLayer((layer) => {
          if ((layer as L.Polygon).getLatLngs) {
            const polygon = layer as L.Polygon;
            const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
            const options = polygon.options as L.PathOptions & { id?: string };
            
            // Build path d attribute FIRST to check for geometry duplicates
            const pathD =
              latlngs
                .map((ll, i) => {
                  const x = ll.lng;
                  const y = svgHeightRef.current - ll.lat;
                  return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
                })
                .join(" ") + " Z";

            // Create geometry signature for deduplication
            const geoSignature = latlngs
              .map((ll) => `${Math.round(ll.lat * 100)},${Math.round(ll.lng * 100)}`)
              .join("|");

            // Skip if we already have a polygon with identical geometry
            if (seenGeometries.has(geoSignature)) {
              console.log(`[SVG Save] Skipping duplicate geometry for layer`);
              skippedDuplicates++;
              return;
            }
            seenGeometries.add(geoSignature);

            // Get base ID
            let id = options.id || `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const baseId = id.replace(/_dup\d+/g, "").replace(/_\d+$/g, "");
            
            // Ensure unique ID
            let uniqueId = baseId;
            if (usedIds.has(baseId)) {
              let counter = 1;
              while (usedIds.has(uniqueId)) {
                uniqueId = `${baseId}_${counter++}`;
              }
            }
            usedIds.add(uniqueId);
            
            // Update layer's ID for consistency
            options.id = uniqueId;

            // Create path element
            const pathEl = workingDoc.createElementNS("http://www.w3.org/2000/svg", "path");
            pathEl.setAttribute("id", uniqueId);
            pathEl.setAttribute("d", pathD);
            pathEl.setAttribute(
              "style",
              `fill:${options.fillColor || "#cccccc"};fill-opacity:${options.fillOpacity || 0.5};stroke:#000000;stroke-width:1`
            );
            
            areaGroup!.appendChild(pathEl);
            pathCount++;
          }
        });

        console.log(`[SVG Save] Added ${pathCount} paths to Area Ruangan (skipped ${skippedDuplicates} duplicates)`);

        // Serialize the modified document
        const serializer = new XMLSerializer();
        svgContent = serializer.serializeToString(workingDoc);

        // Verify the output by parsing it again
        const verifyParser = new DOMParser();
        const verifyDoc = verifyParser.parseFromString(svgContent, "image/svg+xml");
        
        // Check for parse errors
        const parseError = verifyDoc.querySelector('parsererror');
        if (parseError) {
          console.error("[SVG Save] Parse error in generated SVG:", parseError.textContent);
          throw new Error("Generated SVG is malformed");
        }

        // Verify path count
        const verifyAreaGroup = findAreaRuanganGroup(verifyDoc);
        const verifyPathCount = verifyAreaGroup?.querySelectorAll("path").length || 0;
        console.log(`[SVG Save] Verification: ${verifyPathCount} paths in saved document`);

        // Update originalSvgDocRef with the verified clean document
        originalSvgDocRef.current = verifyDoc;
        
      } else {
        // Fallback: create new SVG if original not available
        svgContent = `<?xml version="1.0" encoding="UTF-8"?>`;
        svgContent += `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 ${svgWidthRef.current} ${svgHeightRef.current}">`;
        svgContent += `<g inkscape:label="Area Ruangan">${generatePathsString()}</g>`;
        svgContent += `</svg>`;
      }

      const response = await fetch("/api/save-svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floor: floor.toUpperCase(), svgContent }),
      });

      if (response.ok) {
        setSaveMessage("Berhasil disimpan!");
      } else {
        setSaveMessage("Gagal menyimpan");
      }
    } catch (err) {
      console.error("Error saving SVG:", err);
      setSaveMessage("Error saat menyimpan");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4 shrink-0 overflow-x-auto">
        {/* Back Button */}
        <Link
          href={`/lantai/${floor}`}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors shrink-0"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>

        <div className="h-6 w-px bg-gray-600" />

        {/* Title */}
        <h1 className="text-white font-medium shrink-0">
          Editor Denah - {formatFloorTitle(floor)}
        </h1>

        {/* Floor Tabs */}
        <div className="flex gap-1 shrink-0">
          {floors.map((f) => (
            <Link
              key={f}
              href={`/editor/${f}`}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                f.toLowerCase() === floor.toLowerCase()
                  ? "bg-gray-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {f.toUpperCase()}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Zoom Display */}
        <div className="flex items-center gap-2 text-gray-300 text-sm shrink-0">
          <span>Zoom:</span>
          <span className="bg-gray-700 px-2 py-0.5 rounded font-mono">
            {zoomLevel.toFixed(1)}x
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
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
                d="M20 12H4"
              />
            </svg>
          </button>
          <button
            onClick={handleResetView}
            className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded"
          >
            Fit
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <div className="h-6 w-px bg-gray-600" />

        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={historyIndexRef.current <= 0}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title="Undo (Ctrl+Z)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>

        {/* Save */}
        <button
          onClick={handleSaveSVG}
          disabled={isSaving}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
        {saveMessage && (
          <span
            className={`text-sm ${saveMessage.includes("Berhasil") ? "text-green-400" : "text-red-400"}`}
          >
            {saveMessage}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0 overflow-hidden">
          {/* Tools */}
          <div className="p-3 border-b border-gray-700 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Tools
            </h3>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setToolMode("pan")}
                className={`p-2 rounded flex flex-col items-center gap-1 ${
                  toolMode === "pan"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
                title="Pan (Esc)"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                  />
                </svg>
                <span className="text-[10px]">Pan</span>
              </button>
              <button
                onClick={() => setToolMode("select")}
                className={`p-2 rounded flex flex-col items-center gap-1 ${
                  toolMode === "select"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
                title="Select"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
                <span className="text-[10px]">Select</span>
              </button>
              <button
                onClick={() => setToolMode("polygon")}
                className={`p-2 rounded flex flex-col items-center gap-1 ${
                  toolMode === "polygon"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
                title="Polygon (Ctrl untuk lock axis)"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
                <span className="text-[10px]">Polygon</span>
              </button>
              <button
                onClick={() => setToolMode("rectangle")}
                className={`p-2 rounded flex flex-col items-center gap-1 ${
                  toolMode === "rectangle"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
                title="Rectangle"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span className="text-[10px]">Rect</span>
              </button>
              <button
                onClick={() => setToolMode("polyline")}
                className={`p-2 rounded flex flex-col items-center gap-1 ${
                  toolMode === "polyline"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
                title="Polyline"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-[10px]">Line</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Polygon: Klik untuk titik, double-click selesai. Ctrl = lock axis
            </p>
          </div>

          {/* Colors */}
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Warna & Opacity
            </h3>
            <div className="flex gap-2 items-center mb-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white font-mono"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Opacity</span>
                <span>{Math.round(selectedOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedOpacity}
                onChange={(e) =>
                  handleOpacityChange(parseFloat(e.target.value))
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Object Actions */}
          {(selectedLayer || multiSelectedIds.size > 0) && (
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                {multiSelectedIds.size > 0
                  ? `${multiSelectedIds.size} Objek Dipilih`
                  : "Objek Terpilih"}
              </h3>
              <div className="space-y-1">
                {selectedLayer && multiSelectedIds.size === 0 && (
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={handleBringToFront}
                      className="px-2 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                    >
                      Ke Depan
                    </button>
                    <button
                      onClick={handleSendToBack}
                      className="px-2 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                    >
                      Ke Belakang
                    </button>
                  </div>
                )}
                <button
                  onClick={handleDeleteSelected}
                  className="w-full px-2 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  {multiSelectedIds.size > 0
                    ? `Hapus ${multiSelectedIds.size} Path (Delete)`
                    : "Hapus (Delete)"}
                </button>
                {multiSelectedIds.size > 0 && (
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="w-full px-2 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                  >
                    Batalkan Pilihan
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Paths List */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-700 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase">
                  Daftar Path ({paths.length})
                </h3>
                {multiSelectedIds.size > 0 && (
                  <span className="text-xs text-red-400 font-medium">
                    {multiSelectedIds.size} dipilih
                  </span>
                )}
              </div>
              {/* Select all & bulk delete controls */}
              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 accent-red-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-400">Pilih Semua</span>
                </label>
                {multiSelectedIds.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="ml-auto px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Hapus ({multiSelectedIds.size})
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {paths.map((path, index) => (
                <div
                  key={`${path.id}_${index}`}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    selectedPathId === path.id
                      ? "bg-blue-600 text-white"
                      : multiSelectedIds.has(path.id)
                        ? "bg-red-900/40 text-red-300"
                        : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={multiSelectedIds.has(path.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleMultiSelect(path, e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 accent-red-500 cursor-pointer shrink-0"
                  />
                  <div
                    className="w-4 h-4 rounded border border-gray-500 shrink-0"
                    style={{
                      backgroundColor: path.color,
                      opacity: path.opacity,
                    }}
                    onClick={() => handlePathClick(path)}
                  />
                  <span
                    className="text-xs font-mono truncate flex-1"
                    onClick={() => handlePathClick(path)}
                  >
                    {path.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-900">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
              <div className="text-white">Memuat SVG...</div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
              <div className="text-red-400">{error}</div>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Color Picker */}
          {showColorPicker && selectedLayer && (
            <div
              className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl"
              style={{
                left: Math.min(
                  colorPickerPosition.x + 10,
                  window.innerWidth - 200,
                ),
                top: Math.min(
                  colorPickerPosition.y + 10,
                  window.innerHeight - 150,
                ),
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Opacity</span>
                  <span>{Math.round(selectedOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedOpacity}
                  onChange={(e) =>
                    handleOpacityChange(parseFloat(e.target.value))
                  }
                  className="w-full"
                />
              </div>
              <button
                onClick={() => setShowColorPicker(false)}
                className="mt-2 w-full px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
