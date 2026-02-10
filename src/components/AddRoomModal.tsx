"use client";

import { useState, type ChangeEvent } from "react";
import type { Room } from "@/types/room";

interface AddRoomModalProps {
  pathId: string;
  floor: string;
  color: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Partial<Room>) => void;
}

// Icons as inline SVG components
const Icons = {
  Room: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// InputField component - defined outside to prevent re-creation
interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  placeholder?: string;
  step?: string;
  min?: string;
  required?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const InputField = ({ label, name, type = "text", value, placeholder, step, min, required, onChange }: InputFieldProps) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      step={step}
      min={min}
      required={required}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
    />
  </div>
);

// TextAreaField component - defined outside to prevent re-creation
interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextAreaField = ({ label, name, value, placeholder, rows = 2, onChange }: TextAreaFieldProps) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none"
    />
  </div>
);

// SectionHeader component
interface SectionHeaderProps {
  icon: () => React.ReactElement;
  title: string;
  color: string;
}

const SectionHeader = ({ icon: Icon, title, color }: SectionHeaderProps) => (
  <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${color}`}>
    <div className={color.includes("text-") ? "" : "text-gray-500"}>
      <Icon />
    </div>
    <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
  </div>
);

export default function AddRoomModal({
  pathId,
  floor,
  color,
  isOpen,
  onClose,
  onSave,
}: AddRoomModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    area_sqm: "",
    capacity: "",
    facilities: "",
    status: "available" as Room["status"],
    pic: "",
    phone: "",
    cost_center: "",
    witel: "",
    tenant_name: "",
    company_status: "",
    address: "",
    objek_sewa: "",
    peruntukan: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const roomData: Partial<Room> = {
      path_id: pathId,
      floor: floor.toLowerCase(),
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
      capacity: formData.capacity || null,
      facilities: formData.facilities || null,
      status: formData.status,
      pic: formData.pic || null,
      phone: formData.phone || null,
      color: color,
      cost_center: formData.cost_center || null,
      witel: formData.witel || null,
      tenant_name: formData.tenant_name || null,
      company_status: formData.company_status || null,
      address: formData.address || null,
      objek_sewa: formData.objek_sewa || null,
      peruntukan: formData.peruntukan || null,
    };

    await onSave(roomData);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg shadow-sm border border-gray-200"
                style={{ backgroundColor: color }}
              />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Tambah Data Ruangan</h2>
                <p className="text-sm text-gray-500">{floor.toUpperCase()} • {pathId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <Icons.Close />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Room Info Section */}
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <SectionHeader icon={Icons.Room} title="Informasi Ruangan" color="border-gray-200 text-gray-600" />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Kode Ruangan" name="code" value={formData.code} placeholder="Contoh: R101" required onChange={handleInputChange} />
                    <InputField label="Nama Ruangan" name="name" value={formData.name} placeholder="Contoh: Ruang Meeting A" required onChange={handleInputChange} />
                  </div>
                  <TextAreaField label="Deskripsi" name="description" value={formData.description} placeholder="Deskripsi ruangan..." onChange={handleInputChange} />
                  <div className="grid grid-cols-3 gap-3">
                    <InputField label="Luas (m²)" name="area_sqm" type="number" value={formData.area_sqm} step="0.1" min="0" onChange={handleInputChange} />
                    <InputField label="Kapasitas" name="capacity" value={formData.capacity} onChange={handleInputChange} />
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                      >
                        <option value="available">Tersedia</option>
                        <option value="occupied">Terpakai</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <InputField label="Fasilitas" name="facilities" value={formData.facilities} placeholder="AC, Proyektor, Whiteboard (pisahkan dengan koma)" onChange={handleInputChange} />
                </div>
              </div>

              {/* PIC Section */}
              <div className="bg-purple-50/30 rounded-xl p-4 border border-purple-100">
                <SectionHeader icon={Icons.User} title="Penanggung Jawab" color="border-purple-200 text-purple-600" />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="PIC" name="pic" value={formData.pic} placeholder="Nama penanggung jawab" onChange={handleInputChange} />
                  <InputField label="No. Telepon" name="phone" type="tel" value={formData.phone} placeholder="08xx-xxxx-xxxx" onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Tenant Section */}
              <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
                <SectionHeader icon={Icons.Building} title="Data Tenant" color="border-blue-200 text-blue-600" />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Nama Tenant" name="tenant_name" value={formData.tenant_name} placeholder="Nama tenant" onChange={handleInputChange} />
                    <InputField label="Status Perusahaan" name="company_status" value={formData.company_status} placeholder="Status perusahaan" onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Cost Center" name="cost_center" value={formData.cost_center} placeholder="Cost center" onChange={handleInputChange} />
                    <InputField label="Witel" name="witel" value={formData.witel} placeholder="Witel" onChange={handleInputChange} />
                  </div>
                  <TextAreaField label="Alamat" name="address" value={formData.address} placeholder="Alamat lengkap" onChange={handleInputChange} />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Objek Sewa" name="objek_sewa" value={formData.objek_sewa} placeholder="Objek sewa" onChange={handleInputChange} />
                    <InputField label="Peruntukan" name="peruntukan" value={formData.peruntukan} placeholder="Peruntukan" onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">Catatan</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Data kontrak dapat ditambahkan setelah ruangan disimpan. Anda bisa menambahkan multiple kontrak dengan harga BR/SC yang berbeda.
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Path ID: <span className="font-mono text-gray-500">{pathId}</span></span>
                  <span>•</span>
                  <span>Lantai: <span className="font-semibold text-gray-500">{floor.toUpperCase()}</span></span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving || !formData.code || !formData.name}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Menyimpan..." : "Simpan Ruangan"}
          </button>
        </div>
      </div>
    </div>
  );
}
