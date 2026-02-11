"use client";

import { useState, type ReactElement, type ChangeEvent } from "react";
import type { Room, RoomFormData } from "@/types/room";
import ContractList from "./ContractList";

interface RoomDetailModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Room) => void;
  readOnly?: boolean;
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
  Document: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Currency: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Link: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  Folder: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  ExternalLink: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  EyeOpen: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  EyeClosed: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
};

// Helper function to render field value
const renderField = (val: string | number | null | undefined, suffix?: string) => {
  if (val === null || val === undefined || val === "") return "-";
  return suffix ? `${val} ${suffix}` : String(val);
};

// InputField component - defined outside to prevent re-creation
interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number | null | undefined;
  placeholder?: string;
  step?: string;
  min?: string;
  isEditing: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const InputField = ({ label, name, type = "text", value, placeholder, step, min, isEditing, onChange }: InputFieldProps) => {
  // For number inputs, allow both comma and period as decimal separator
  const handleNumberInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (type === "number" && e.target.value) {
      // Create a synthetic event with the comma replaced by period
      const normalizedValue = e.target.value.replace(",", ".");
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: normalizedValue,
          name: e.target.name,
        },
      } as ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    } else {
      onChange(e);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={handleNumberInput}
          step={step}
          min={min}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
        />
      ) : (
        <p className="text-sm text-gray-800">{renderField(value)}</p>
      )}
    </div>
  );
};

// TextAreaField component - defined outside to prevent re-creation
interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  rows?: number;
  isEditing: boolean;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextAreaField = ({ label, name, value, placeholder, rows = 2, isEditing, onChange }: TextAreaFieldProps) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    {isEditing ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none"
      />
    ) : (
      <p className="text-sm text-gray-600">{value || "-"}</p>
    )}
  </div>
);

// SectionHeader component - defined outside to prevent re-creation
interface SectionHeaderProps {
  icon: () => ReactElement;
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

// Helper function to detect Google Drive links
const isGoogleDriveLink = (url: string): boolean => {
  return url.includes("drive.google.com") || url.includes("docs.google.com");
};

// Extract Google Drive file ID from URL
const getGoogleDriveFileId = (url: string): string | null => {
  // Pattern for /file/d/{fileId}/ or /d/{fileId}/
  const fileIdMatch = url.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) return fileIdMatch[1];

  // Pattern for id={fileId}
  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];

  return null;
};

// Get preview URL for Google Drive
const getGoogleDrivePreviewUrl = (url: string): string | null => {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

export default function RoomDetailModal({
  room,
  isOpen,
  onClose,
  onSave,
  readOnly = false,
}: RoomDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // State for selected contract preview - null means no preview shown
  const [previewContractUrl, setPreviewContractUrl] = useState<string | null>(null);
  
  // Initialize formData with room data
  const initialFormData: RoomFormData = {
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
  };
  
  const [formData, setFormData] = useState<RoomFormData>(initialFormData);

  if (!isOpen) return null;

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    if (!isEditing) return false;
    
    // Compare current formData with initial data
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  // Handle close with confirmation if has unsaved changes
  const handleClose = () => {
    if (hasUnsavedChanges()) {
      const confirmClose = window.confirm(
        "Ada perubahan yang belum disimpan. Apakah Anda yakin ingin menutup?"
      );
      if (!confirmClose) {
        return; // Don't close if user cancels
      }
    }
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const numberFields = ["area_sqm", "contract_duration_months", "br_area", "sc_area", "br_price_per_m2", "sc_price_per_m2"];
    setFormData((prev) => ({
      ...prev,
      [name]: numberFields.includes(name) 
        ? (value ? parseFloat(value.replace(",", ".")) : null) 
        : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare data - convert empty strings to null for date fields
      const dataToSave = {
        ...formData,
        // Convert empty strings to null for date fields
        contract_start: formData.contract_start || null,
        contract_end: formData.contract_end || null,
        // Convert empty strings to null for optional text fields
        cost_center: formData.cost_center || null,
        witel: formData.witel || null,
        tenant_name: formData.tenant_name || null,
        company_status: formData.company_status || null,
        address: formData.address || null,
        objek_sewa: formData.objek_sewa || null,
        peruntukan: formData.peruntukan || null,
        jenis_dokumen: formData.jenis_dokumen || null,
        judul_dokumen: formData.judul_dokumen || null,
        no_tgl_dokumen: formData.no_tgl_dokumen || null,
        link_dok_evidence: formData.link_dok_evidence || null,
        satuan: formData.satuan || null,
        description: formData.description || null,
        capacity: formData.capacity || null,
        facilities: formData.facilities || null,
        pic: formData.pic || null,
        phone: formData.phone || null,
      };

      const response = await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      
      if (response.ok) {
        const updatedRoom = await response.json();
        onSave(updatedRoom);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        console.error("Error saving room:", errorData);
        alert(`Gagal menyimpan: ${errorData.error || "Terjadi kesalahan"}`);
      }
    } catch (error) {
      console.error("Error saving room:", error);
      alert("Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Check if there are unsaved changes
    if (hasUnsavedChanges()) {
      const confirmCancel = window.confirm(
        "Ada perubahan yang belum disimpan. Apakah Anda yakin ingin membatalkan?"
      );
      if (!confirmCancel) {
        return; // Don't cancel if user declines
      }
    }
    
    // Reset form to initial values
    setFormData(initialFormData);
    setIsEditing(false);
  };

  const statusLabels: Record<string, string> = {
    available: "Tersedia",
    occupied: "Terpakai",
    maintenance: "Maintenance",
  };

  const statusColors: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700 border-emerald-200",
    occupied: "bg-blue-100 text-blue-700 border-blue-200",
    maintenance: "bg-amber-100 text-amber-700 border-amber-200",
  };

  // Contract preview logic
  const hasContractPreview = !!previewContractUrl;
  const isGDriveLink = previewContractUrl ? isGoogleDriveLink(previewContractUrl) : false;
  const docPreviewUrl = previewContractUrl && isGDriveLink ? getGoogleDrivePreviewUrl(previewContractUrl) : null;

  // Determine modal width based on preview visibility
  const showDocumentPreview = hasContractPreview && !isEditing;
  const modalMaxWidth = showDocumentPreview ? "max-w-7xl" : "max-w-4xl";

  // Handler for contract preview toggle
  const handleContractPreview = (url: string | null) => {
    // Toggle off if same URL, otherwise show new preview
    setPreviewContractUrl(prevUrl => prevUrl === url ? null : url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${modalMaxWidth} max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl border-2 border-white shadow-md"
                style={{ backgroundColor: room.color || "#cccccc" }}
              />
              <div>
                <h2 className="text-lg font-bold text-gray-900">{room.name}</h2>
                <p className="text-sm text-gray-500">{room.code} • {room.floor.toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[room.status]}`}>
                {statusLabels[room.status]}
              </span>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                title="Tutup"
              >
                <Icons.Close />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Dynamic Columns */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`grid gap-6 ${showDocumentPreview ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"}`}>
            {/* Left Column - Room Info */}
            <div className="space-y-6">
              {/* Basic Info Section */}
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <SectionHeader icon={Icons.Room} title="Informasi Ruangan" color="border-blue-200" />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Kode Ruangan" name="code" value={formData.code} isEditing={isEditing} onChange={handleInputChange} />
                    <InputField label="Nama Ruangan" name="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} />
                  </div>
                  <TextAreaField label="Deskripsi" name="description" value={formData.description} placeholder="Deskripsi ruangan..." isEditing={isEditing} onChange={handleInputChange} />
                  <div className="grid grid-cols-3 gap-3">
                    <InputField label="Luas (m²)" name="area_sqm" type="number" value={formData.area_sqm} step="0.1" min="0" isEditing={isEditing} onChange={handleInputChange} />
                    <InputField label="Kapasitas" name="capacity" value={formData.capacity} isEditing={isEditing} onChange={handleInputChange} />
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                      {isEditing ? (
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
                      ) : (
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColors[room.status]}`}>
                          {statusLabels[room.status]}
                        </span>
                      )}
                    </div>
                  </div>
                  <InputField label="Fasilitas" name="facilities" value={formData.facilities} placeholder="AC, Proyektor, Whiteboard" isEditing={isEditing} onChange={handleInputChange} />
                </div>
              </div>

              {/* Tenant Section */}
              <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
                <SectionHeader icon={Icons.Building} title="Data Tenant" color="border-blue-200 text-blue-600" />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Nama Tenant" name="tenant_name" value={formData.tenant_name} placeholder="Nama tenant" isEditing={isEditing} onChange={handleInputChange} />
                    <InputField label="Status Perusahaan" name="company_status" value={formData.company_status} placeholder="Status perusahaan" isEditing={isEditing} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Cost Center" name="cost_center" value={formData.cost_center} placeholder="Cost center" isEditing={isEditing} onChange={handleInputChange} />
                    <InputField label="Witel" name="witel" value={formData.witel} placeholder="Witel" isEditing={isEditing} onChange={handleInputChange} />
                  </div>
                  <TextAreaField label="Alamat" name="address" value={formData.address} placeholder="Alamat lengkap" isEditing={isEditing} onChange={handleInputChange} />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Objek Sewa" name="objek_sewa" value={formData.objek_sewa} placeholder="Objek sewa" isEditing={isEditing} onChange={handleInputChange} />
                    <InputField label="Peruntukan" name="peruntukan" value={formData.peruntukan} placeholder="Peruntukan" isEditing={isEditing} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* PIC Section */}
              <div className="bg-purple-50/30 rounded-xl p-4 border border-purple-100">
                <SectionHeader icon={Icons.User} title="Penanggung Jawab" color="border-purple-200 text-purple-600" />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="PIC" name="pic" value={formData.pic} placeholder="Nama PIC" isEditing={isEditing} onChange={handleInputChange} />
                  <InputField label="No. Telepon" name="phone" type="tel" value={formData.phone} placeholder="08xx-xxxx-xxxx" isEditing={isEditing} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Middle Column - Contracts */}
            <div className="space-y-6">
              {/* Contracts Section - Multiple Contracts Support */}
              <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100">
                <SectionHeader icon={Icons.Calendar} title="Data Kontrak" color="border-emerald-200 text-emerald-600" />
                <ContractList 
                  roomId={room.id} 
                  onPreview={handleContractPreview}
                  activePreviewUrl={previewContractUrl}
                  readOnly={readOnly}
                />
              </div>

              {/* Meta Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Path ID: <span className="font-mono text-gray-500">{room.path_id}</span></span>
                  <span>•</span>
                  <span>Update: {new Date(room.updated_at).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Document Preview (only shown when a contract document is selected) */}
            {showDocumentPreview && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Icons.Document />
                      <h3 className="text-sm font-semibold text-gray-700">Preview Dokumen Kontrak</h3>
                    </div>
                    <button
                      onClick={() => setPreviewContractUrl(null)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Tutup Preview"
                    >
                      <Icons.Close />
                    </button>
                  </div>
                  {isGDriveLink && docPreviewUrl ? (
                    <div className="flex-1 rounded-lg overflow-hidden bg-white border border-gray-200 min-h-[400px]">
                      <iframe
                        src={docPreviewUrl}
                        className="w-full h-full min-h-[400px]"
                        allow="autoplay"
                        title="Document Preview"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-gray-200 min-h-[400px]">
                      <div className="text-center text-gray-400">
                        <Icons.Folder />
                        <p className="mt-2 text-sm">Preview tidak tersedia untuk link ini</p>
                        <a
                          href={previewContractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Icons.ExternalLink />
                          Buka di Tab Baru
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className={`${readOnly ? "w-full" : "flex-1"} px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium`}
              >
                Tutup
              </button>
              {!readOnly && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                >
                  Edit Data
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
