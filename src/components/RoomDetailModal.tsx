"use client";

import { useState } from "react";
import type { Room, RoomFormData } from "@/types/room";

interface RoomDetailModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Room) => void;
}

export default function RoomDetailModal({
  room,
  isOpen,
  onClose,
  onSave,
}: RoomDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<RoomFormData>({
    code: room.code,
    name: room.name,
    description: room.description || "",
    area_sqm: room.area_sqm,
    capacity: room.capacity || "",
    facilities: room.facilities || "",
    status: room.status,
    pic: room.pic || "",
    phone: room.phone || "",
    cost_center: room.cost_center || "",
    witel: room.witel || "",
    tenant_name: room.tenant_name || "",
    company_status: room.company_status || "",
    address: room.address || "",
    objek_sewa: room.objek_sewa || "",
    peruntukan: room.peruntukan || "",
    jenis_dokumen: room.jenis_dokumen || "",
    judul_dokumen: room.judul_dokumen || "",
    no_tgl_dokumen: room.no_tgl_dokumen || "",
    link_dok_evidence: room.link_dok_evidence || "",
    contract_start: room.contract_start || "",
    contract_end: room.contract_end || "",
    contract_duration_months: room.contract_duration_months,
    br_area: room.br_area,
    sc_area: room.sc_area,
    satuan: room.satuan || "",
    br_price_per_m2: room.br_price_per_m2,
    sc_price_per_m2: room.sc_price_per_m2,
  });

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const numberFields = [
      "area_sqm",
      "contract_duration_months",
      "br_area",
      "sc_area",
      "br_price_per_m2",
      "sc_price_per_m2",
    ];
    setFormData((prev) => ({
      ...prev,
      [name]: numberFields.includes(name)
        ? value
          ? parseFloat(value)
          : null
        : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        onSave(updatedRoom);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving room:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      code: room.code,
      name: room.name,
      description: room.description || "",
      area_sqm: room.area_sqm,
      capacity: room.capacity || "",
      facilities: room.facilities || "",
      status: room.status,
      pic: room.pic || "",
      phone: room.phone || "",
      cost_center: room.cost_center || "",
      witel: room.witel || "",
      tenant_name: room.tenant_name || "",
      company_status: room.company_status || "",
      address: room.address || "",
      objek_sewa: room.objek_sewa || "",
      peruntukan: room.peruntukan || "",
      jenis_dokumen: room.jenis_dokumen || "",
      judul_dokumen: room.judul_dokumen || "",
      no_tgl_dokumen: room.no_tgl_dokumen || "",
      link_dok_evidence: room.link_dok_evidence || "",
      contract_start: room.contract_start || "",
      contract_end: room.contract_end || "",
      contract_duration_months: room.contract_duration_months,
      br_area: room.br_area,
      sc_area: room.sc_area,
      satuan: room.satuan || "",
      br_price_per_m2: room.br_price_per_m2,
      sc_price_per_m2: room.sc_price_per_m2,
    });
    setIsEditing(false);
  };

  const statusLabels: Record<string, string> = {
    available: "Tersedia",
    occupied: "Terpakai",
    maintenance: "Maintenance",
  };

  const renderField = (val: string | number | null | undefined, suffix?: string) => {
    if (val === null || val === undefined || val === "") return "-";
    return suffix ? `${val} ${suffix}` : String(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? "Edit Ruangan" : "Detail Ruangan"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info Card */}
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              Path ID: <span className="font-mono text-gray-800">{room.path_id}</span>
            </p>
            <p className="text-sm text-gray-600">
              Lantai: <span className="font-semibold text-gray-800">{room.floor.toUpperCase()}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">Warna:</span>
              <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: room.color || "#cccccc" }} />
              <span className="text-sm font-mono text-gray-600">{room.color || "#cccccc"}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Kode & Nama */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Ruangan</label>
                {isEditing ? (
                  <input type="text" name="code" value={formData.code} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.code}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ruangan</label>
                {isEditing ? (
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.name}</p>
                )}
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              {isEditing ? (
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Deskripsi ruangan..." />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-600">{room.description || "-"}</p>
              )}
            </div>

            {/* Luas, Kapasitas, Status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Luas (m²)</label>
                {isEditing ? (
                  <input type="number" name="area_sqm" value={formData.area_sqm ?? ""} onChange={handleInputChange} step="0.1" min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{renderField(room.area_sqm, "m²")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
                {isEditing ? (
                  <input type="text" name="capacity" value={formData.capacity} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.capacity || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                {isEditing ? (
                  <select name="status" value={formData.status} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400">
                    <option value="available">Tersedia</option>
                    <option value="occupied">Terpakai</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                      room.status === "available" ? "bg-gray-200 text-gray-800"
                        : room.status === "occupied" ? "bg-gray-600 text-white"
                        : "bg-gray-400 text-gray-900"
                    }`}>
                      {statusLabels[room.status]}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Fasilitas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fasilitas</label>
              {isEditing ? (
                <input type="text" name="facilities" value={formData.facilities} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="AC, Proyektor, Whiteboard (pisahkan dengan koma)" />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-600">{room.facilities || "-"}</p>
              )}
            </div>

            {/* PIC & Telepon */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIC</label>
                {isEditing ? (
                  <input type="text" name="pic" value={formData.pic} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Nama penanggung jawab" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.pic || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                {isEditing ? (
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="08xx-xxxx-xxxx" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.phone || "-"}</p>
                )}
              </div>
            </div>

            {/* Separator - Data Tenant */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Data Tenant</h3>
            </div>

            {/* Tenant Name & Company Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tenant</label>
                {isEditing ? (
                  <input type="text" name="tenant_name" value={formData.tenant_name} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Nama tenant" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.tenant_name || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Perusahaan</label>
                {isEditing ? (
                  <input type="text" name="company_status" value={formData.company_status} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Status perusahaan" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.company_status || "-"}</p>
                )}
              </div>
            </div>

            {/* Cost Center & Witel */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Center</label>
                {isEditing ? (
                  <input type="text" name="cost_center" value={formData.cost_center} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Cost center" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.cost_center || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Witel</label>
                {isEditing ? (
                  <input type="text" name="witel" value={formData.witel} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Witel" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.witel || "-"}</p>
                )}
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              {isEditing ? (
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Alamat lengkap" />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-600">{room.address || "-"}</p>
              )}
            </div>

            {/* Objek Sewa & Peruntukan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objek Sewa</label>
                {isEditing ? (
                  <input type="text" name="objek_sewa" value={formData.objek_sewa} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Objek sewa" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.objek_sewa || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peruntukan</label>
                {isEditing ? (
                  <input type="text" name="peruntukan" value={formData.peruntukan} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Peruntukan" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.peruntukan || "-"}</p>
                )}
              </div>
            </div>

            {/* Separator - Data Dokumen */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Data Dokumen</h3>
            </div>

            {/* Jenis & Judul Dokumen */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Dokumen</label>
                {isEditing ? (
                  <input type="text" name="jenis_dokumen" value={formData.jenis_dokumen} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Jenis dokumen" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.jenis_dokumen || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No/Tgl Dokumen</label>
                {isEditing ? (
                  <input type="text" name="no_tgl_dokumen" value={formData.no_tgl_dokumen} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="No/Tgl dokumen" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.no_tgl_dokumen || "-"}</p>
                )}
              </div>
            </div>

            {/* Judul Dokumen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Dokumen</label>
              {isEditing ? (
                <input type="text" name="judul_dokumen" value={formData.judul_dokumen} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Judul dokumen" />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.judul_dokumen || "-"}</p>
              )}
            </div>

            {/* Link Dokumen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Dokumen Evidence</label>
              {isEditing ? (
                <input type="url" name="link_dok_evidence" value={formData.link_dok_evidence} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="https://..." />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {room.link_dok_evidence ? (
                    <a href={room.link_dok_evidence} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{room.link_dok_evidence}</a>
                  ) : "-"}
                </p>
              )}
            </div>

            {/* Separator - Data Kontrak */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Data Kontrak</h3>
            </div>

            {/* Contract Start, End, Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mulai Kontrak</label>
                {isEditing ? (
                  <input type="date" name="contract_start" value={formData.contract_start} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.contract_start || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Akhir Kontrak</label>
                {isEditing ? (
                  <input type="date" name="contract_end" value={formData.contract_end} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.contract_end || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (bulan)</label>
                {isEditing ? (
                  <input type="number" name="contract_duration_months" value={formData.contract_duration_months ?? ""} onChange={handleInputChange} min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{renderField(room.contract_duration_months, "bulan")}</p>
                )}
              </div>
            </div>

            {/* Separator - Data Area & Harga */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Area & Harga</h3>
            </div>

            {/* BR Area, SC Area, Satuan */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BR Area</label>
                {isEditing ? (
                  <input type="number" name="br_area" value={formData.br_area ?? ""} onChange={handleInputChange} step="0.01" min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{renderField(room.br_area)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SC Area</label>
                {isEditing ? (
                  <input type="number" name="sc_area" value={formData.sc_area ?? ""} onChange={handleInputChange} step="0.01" min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{renderField(room.sc_area)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                {isEditing ? (
                  <input type="text" name="satuan" value={formData.satuan} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="m², unit, dll" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{room.satuan || "-"}</p>
                )}
              </div>
            </div>

            {/* BR Price & SC Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga BR/m²</label>
                {isEditing ? (
                  <input type="number" name="br_price_per_m2" value={formData.br_price_per_m2 ?? ""} onChange={handleInputChange} step="0.01" min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{renderField(room.br_price_per_m2)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga SC/m²</label>
                {isEditing ? (
                  <input type="number" name="sc_price_per_m2" value={formData.sc_price_per_m2 ?? ""} onChange={handleInputChange} step="0.01" min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{renderField(room.sc_price_per_m2)}</p>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
              {isEditing ? (
                <>
                  <button type="button" onClick={handleCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Batal
                  </button>
                  <button type="button" onClick={handleSave} disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? "Menyimpan..." : "Simpan"}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Tutup
                  </button>
                  <button type="button" onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
