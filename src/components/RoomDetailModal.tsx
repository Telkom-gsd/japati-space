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
  });

  if (!isOpen) return null;

  const statusLabels = {
    available: "Tersedia",
    occupied: "Terpakai",
    maintenance: "Maintenance",
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "area_sqm" ? (value ? parseFloat(value) : null) : value,
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
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: room.color || "#cccccc" }}
            />
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Ruangan" : "Detail Ruangan"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Kode Ruangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Ruangan
            </label>
            {isEditing ? (
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            ) : (
              <p className="text-gray-900">{room.code}</p>
            )}
          </div>

          {/* Nama Ruangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Ruangan
            </label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            ) : (
              <p className="text-gray-900">{room.name}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            ) : (
              <p className="text-gray-600">{room.description || "-"}</p>
            )}
          </div>

          {/* Lantai */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lantai
            </label>
            <p className="text-gray-900">{room.floor.toUpperCase()}</p>
          </div>

          {/* Luas Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Luas Area (m²)
            </label>
            {isEditing ? (
              <input
                type="number"
                name="area_sqm"
                value={formData.area_sqm || ""}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            ) : (
              <p className="text-gray-900">
                {room.area_sqm ? `${room.area_sqm} m²` : "-"}
              </p>
            )}
          </div>

          {/* Kapasitas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kapasitas
            </label>
            {isEditing ? (
              <input
                type="text"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            ) : (
              <p className="text-gray-900">{room.capacity || "-"}</p>
            )}
          </div>

          {/* Fasilitas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fasilitas
            </label>
            {isEditing ? (
              <textarea
                name="facilities"
                value={formData.facilities}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            ) : (
              <p className="text-gray-600">{room.facilities || "-"}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            {isEditing ? (
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value="available">Tersedia</option>
                <option value="occupied">Terpakai</option>
                <option value="maintenance">Maintenance</option>
              </select>
            ) : (
              <span
                className={`inline-block px-2 py-1 text-sm rounded ${
                  room.status === "available"
                    ? "bg-gray-200 text-gray-800"
                    : room.status === "occupied"
                      ? "bg-gray-600 text-white"
                      : "bg-gray-400 text-gray-900"
                }`}
              >
                {statusLabels[room.status]}
              </span>
            )}
          </div>

          {/* PIC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIC (Person In Charge)
            </label>
            {isEditing ? (
              <input
                type="text"
                name="pic"
                value={formData.pic}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            ) : (
              <p className="text-gray-900">{room.pic || "-"}</p>
            )}
          </div>

          {/* Telepon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telepon
            </label>
            {isEditing ? (
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            ) : (
              <p className="text-gray-900">{room.phone || "-"}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
