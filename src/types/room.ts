// Contract interface for multiple contracts per room
export interface Contract {
  id: string;
  room_id: string;
  jenis_dokumen: string | null;
  judul_dokumen: string | null;
  no_tgl_dokumen: string | null;
  link_dok_evidence: string | null;
  contract_start: string | null;
  contract_end: string | null;
  contract_duration_months: number | null;
  br_area: number | null;
  sc_area: number | null;
  satuan: string | null;
  br_price_per_m2: number | null;
  sc_price_per_m2: number | null;
  notes: string | null;
  status: "active" | "expired" | "upcoming";
  created_at: string;
  updated_at: string;
}

export interface ContractFormData {
  jenis_dokumen: string;
  judul_dokumen: string;
  no_tgl_dokumen: string;
  link_dok_evidence: string;
  contract_start: string;
  contract_end: string;
  contract_duration_months: number | null;
  br_area: number | null;
  sc_area: number | null;
  satuan: string;
  br_price_per_m2: number | null;
  sc_price_per_m2: number | null;
  notes: string;
  status: "active" | "expired" | "upcoming";
}

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
  // Tenant info (shared across contracts)
  cost_center: string | null;
  witel: string | null;
  tenant_name: string | null;
  company_status: string | null;
  address: string | null;
  objek_sewa: string | null;
  peruntukan: string | null;
  // Legacy contract fields (for backward compatibility, will be deprecated)
  jenis_dokumen: string | null;
  judul_dokumen: string | null;
  no_tgl_dokumen: string | null;
  link_dok_evidence: string | null;
  contract_start: string | null;
  contract_end: string | null;
  contract_duration_months: number | null;
  br_area: number | null;
  sc_area: number | null;
  satuan: string | null;
  br_price_per_m2: number | null;
  sc_price_per_m2: number | null;
  // New: array of contracts
  contracts?: Contract[];
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
  cost_center: string;
  witel: string;
  tenant_name: string;
  company_status: string;
  address: string;
  objek_sewa: string;
  peruntukan: string;
  jenis_dokumen: string;
  judul_dokumen: string;
  no_tgl_dokumen: string;
  link_dok_evidence: string;
  contract_start: string;
  contract_end: string;
  contract_duration_months: number | null;
  br_area: number | null;
  sc_area: number | null;
  satuan: string;
  br_price_per_m2: number | null;
  sc_price_per_m2: number | null;
}

export interface SVGRoom {
  pathId: string;
  color: string;
  pathElement: SVGPathElement | SVGPolygonElement | SVGRectElement;
}
