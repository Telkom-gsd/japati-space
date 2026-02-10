"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import type { Contract, ContractFormData } from "@/types/room";

// Icons
const Icons = {
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ExternalLink: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  EyeOff: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
};

interface ContractListProps {
  roomId: string;
  onContractChange?: () => void;
  onPreview?: (url: string | null) => void;
  activePreviewUrl?: string | null;
}

const emptyContract: ContractFormData = {
  jenis_dokumen: "",
  judul_dokumen: "",
  no_tgl_dokumen: "",
  link_dok_evidence: "",
  contract_start: "",
  contract_end: "",
  contract_duration_months: null,
  br_area: null,
  sc_area: null,
  satuan: "",
  br_price_per_m2: null,
  sc_price_per_m2: null,
  notes: "",
  status: "active",
};

// Contract Form Component - defined outside to prevent re-creation on each render
interface ContractFormProps {
  formData: ContractFormData;
  editingId: string | null;
  isSaving: boolean;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCancel: () => void;
  onSave: () => void;
}

const ContractForm = ({ formData, editingId, isSaving, onInputChange, onCancel, onSave }: ContractFormProps) => (
  <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-4">
    <div className="flex items-center justify-between">
      <h4 className="font-medium text-gray-800">
        {editingId ? "Edit Kontrak" : "Tambah Kontrak Baru"}
      </h4>
      <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
        <Icons.Close />
      </button>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Dokumen</label>
        <input
          type="text"
          name="jenis_dokumen"
          value={formData.jenis_dokumen}
          onChange={onInputChange}
          placeholder="PKS / Kontrak, Akta Notaris"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">No/Tgl Dokumen</label>
        <input
          type="text"
          name="no_tgl_dokumen"
          value={formData.no_tgl_dokumen}
          onChange={onInputChange}
          placeholder="Nomor dan tanggal dokumen"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Judul Dokumen</label>
      <textarea
        name="judul_dokumen"
        value={formData.judul_dokumen}
        onChange={onInputChange}
        rows={2}
        placeholder="Judul dokumen kontrak..."
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
      />
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Link Dokumen</label>
      <input
        type="url"
        name="link_dok_evidence"
        value={formData.link_dok_evidence}
        onChange={onInputChange}
        placeholder="https://..."
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      />
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Mulai Kontrak</label>
        <input
          type="date"
          name="contract_start"
          value={formData.contract_start}
          onChange={onInputChange}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Akhir Kontrak</label>
        <input
          type="date"
          name="contract_end"
          value={formData.contract_end}
          onChange={onInputChange}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Durasi (bulan)</label>
        <input
          type="number"
          name="contract_duration_months"
          value={formData.contract_duration_months ?? ""}
          onChange={onInputChange}
          min="0"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Luas BR (m²)</label>
        <input
          type="number"
          name="br_area"
          value={formData.br_area ?? ""}
          onChange={onInputChange}
          step="0.01"
          min="0"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Luas SC (m²)</label>
        <input
          type="number"
          name="sc_area"
          value={formData.sc_area ?? ""}
          onChange={onInputChange}
          step="0.01"
          min="0"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Satuan</label>
        <input
          type="text"
          name="satuan"
          value={formData.satuan}
          onChange={onInputChange}
          placeholder="m², unit, titik"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Harga BR/m² (Rp)</label>
        <input
          type="number"
          name="br_price_per_m2"
          value={formData.br_price_per_m2 ?? ""}
          onChange={onInputChange}
          step="0.01"
          min="0"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Harga SC/m² (Rp)</label>
        <input
          type="number"
          name="sc_price_per_m2"
          value={formData.sc_price_per_m2 ?? ""}
          onChange={onInputChange}
          step="0.01"
          min="0"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Catatan</label>
      <textarea
        name="notes"
        value={formData.notes}
        onChange={onInputChange}
        rows={2}
        placeholder="Catatan tambahan..."
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
      />
    </div>

    <div className="flex gap-2 pt-2">
      <button
        onClick={onCancel}
        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
      >
        Batal
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {isSaving ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  </div>
);

export default function ContractList({ roomId, onContractChange, onPreview, activePreviewUrl }: ContractListProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContractFormData>(emptyContract);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch contracts
  useEffect(() => {
    fetchContracts();
  }, [roomId]);

  const fetchContracts = async () => {
    try {
      const response = await fetch(`/api/contracts?room_id=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numberFields = ["contract_duration_months", "br_area", "sc_area", "br_price_per_m2", "sc_price_per_m2"];
    setFormData((prev) => ({
      ...prev,
      [name]: numberFields.includes(name) ? (value ? parseFloat(value) : null) : value,
    }));
  };

  const handleAdd = () => {
    setFormData(emptyContract);
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (contract: Contract) => {
    setFormData({
      jenis_dokumen: contract.jenis_dokumen || "",
      judul_dokumen: contract.judul_dokumen || "",
      no_tgl_dokumen: contract.no_tgl_dokumen || "",
      link_dok_evidence: contract.link_dok_evidence || "",
      contract_start: contract.contract_start || "",
      contract_end: contract.contract_end || "",
      contract_duration_months: contract.contract_duration_months,
      br_area: contract.br_area,
      sc_area: contract.sc_area,
      satuan: contract.satuan || "",
      br_price_per_m2: contract.br_price_per_m2,
      sc_price_per_m2: contract.sc_price_per_m2,
      notes: contract.notes || "",
      status: contract.status,
    });
    setEditingId(contract.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(emptyContract);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        contract_start: formData.contract_start || null,
        contract_end: formData.contract_end || null,
      };

      if (editingId) {
        // Update existing
        const response = await fetch(`/api/contracts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });
        if (response.ok) {
          await fetchContracts();
          setEditingId(null);
          onContractChange?.();
        }
      } else {
        // Create new
        const response = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_id: roomId, ...dataToSave }),
        });
        if (response.ok) {
          await fetchContracts();
          setIsAdding(false);
          onContractChange?.();
        }
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      alert("Gagal menyimpan kontrak");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kontrak ini?")) return;
    
    try {
      const response = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchContracts();
        onContractChange?.();
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Gagal menghapus kontrak");
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      expired: "bg-red-100 text-red-700",
      upcoming: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = {
      active: "Aktif",
      expired: "Expired",
      upcoming: "Akan Datang",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm">Memuat kontrak...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {contracts.length} Kontrak
          </span>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Icons.Plus />
            Tambah
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <ContractForm
          formData={formData}
          editingId={editingId}
          isSaving={isSaving}
          onInputChange={handleInputChange}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      )}

      {/* Contract List */}
      {contracts.length === 0 && !isAdding ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Belum ada kontrak</p>
          <button
            onClick={handleAdd}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Tambah kontrak pertama
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map((contract) => (
            <div key={contract.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {editingId === contract.id ? (
                <div className="p-3">
                  <ContractForm
                    formData={formData}
                    editingId={editingId}
                    isSaving={isSaving}
                    onInputChange={handleInputChange}
                    onCancel={handleCancel}
                    onSave={handleSave}
                  />
                </div>
              ) : (
                <>
                  {/* Contract Header - Collapsed View */}
                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(contract.status)}
                        </div>
                        <span className="text-sm font-medium text-gray-800 mt-1">
                          {contract.judul_dokumen || `${formatDate(contract.contract_start)} - ${formatDate(contract.contract_end)}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(contract.contract_start)} - {formatDate(contract.contract_end)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Preview Button - only show if contract has document link */}
                      {contract.link_dok_evidence && onPreview && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreview(contract.link_dok_evidence!);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            activePreviewUrl === contract.link_dok_evidence 
                              ? "bg-blue-100 text-blue-600" 
                              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          }`}
                          title={activePreviewUrl === contract.link_dok_evidence ? "Tutup Preview" : "Lihat Dokumen"}
                        >
                          {activePreviewUrl === contract.link_dok_evidence ? <Icons.EyeOff /> : <Icons.Eye />}
                        </button>
                      )}
                      <div className="text-right mr-2">
                        <p className="text-xs text-gray-500">BR/m²</p>
                        <p className="text-sm font-medium text-gray-800">
                          {formatCurrency(contract.br_price_per_m2)}
                        </p>
                      </div>
                      {expandedId === contract.id ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                    </div>
                  </div>

                  {/* Contract Details - Expanded View */}
                  {expandedId === contract.id && (
                    <div className="p-4 border-t border-gray-200 bg-white">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Jenis Dokumen</p>
                          <p className="text-gray-800">{contract.jenis_dokumen || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">No/Tgl Dokumen</p>
                          <p className="text-gray-800">{contract.no_tgl_dokumen || "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Judul Dokumen</p>
                          <p className="text-gray-800">{contract.judul_dokumen || "-"}</p>
                        </div>
                        {contract.link_dok_evidence && (
                          <div className="col-span-2">
                            <a
                              href={contract.link_dok_evidence}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Icons.ExternalLink />
                              Buka Dokumen
                            </a>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Durasi</p>
                          <p className="text-gray-800">{contract.contract_duration_months || "-"} bulan</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Satuan</p>
                          <p className="text-gray-800">{contract.satuan || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Luas BR</p>
                          <p className="text-gray-800">{contract.br_area || "-"} {contract.satuan}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Luas SC</p>
                          <p className="text-gray-800">{contract.sc_area || "-"} {contract.satuan}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Harga BR/m²</p>
                          <p className="text-gray-800 font-medium">{formatCurrency(contract.br_price_per_m2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Harga SC/m²</p>
                          <p className="text-gray-800 font-medium">{formatCurrency(contract.sc_price_per_m2)}</p>
                        </div>
                        {contract.notes && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">Catatan</p>
                            <p className="text-gray-800">{contract.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(contract);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Icons.Edit />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(contract.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          <Icons.Trash />
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
