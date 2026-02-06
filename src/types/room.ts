export interface Room {
  id: string;
  path_id: string;
  floor: string;
  code: string;
  name: string;
  description: string | null;
  area_sqm: number | null;
  capacity: string | null;
  facilities: string | null;
  status: "available" | "occupied" | "maintenance";
  pic: string | null;
  phone: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomFormData {
  code: string;
  name: string;
  description: string;
  area_sqm: number | null;
  capacity: string;
  facilities: string;
  status: "available" | "occupied" | "maintenance";
  pic: string;
  phone: string;
}

export interface SVGRoom {
  pathId: string;
  color: string;
  pathElement: SVGPathElement;
}
