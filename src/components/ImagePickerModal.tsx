"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Loader2,
  Check,
  Upload,
  FolderOpen,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Portal from "@/components/Portal";

interface FirebaseImage {
  name: string;
  path: string;
  url: string;
}

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  currentImage?: string;
}

const FOLDERS = [
  { id: "", label: "Thư mục gốc" },
  { id: "san-pham", label: "Sản phẩm" },
  { id: "ke-hoach-sx", label: "Kế hoạch SX" },
];

const ITEMS_PER_PAGE = 24;

export default function ImagePickerModal({
  isOpen,
  onClose,
  onSelect,
  currentImage,
}: ImagePickerModalProps) {
  const [images, setImages] = useState<FirebaseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(
    currentImage || null,
  );
  const [currentPage, setCurrentPage] = useState(1);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/firebase-storage?folder=${selectedFolder}`,
      );
      const result = await response.json();
      if (result.success) {
        setImages(result.files);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, selectedFolder]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", selectedFolder);

    try {
      const response = await fetch("/api/firebase-storage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setSelectedImage(result.url);
        fetchImages();
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      onClose();
    }
  };

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedImages = filteredImages.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Reset to page 1 when search term or folder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFolder]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} />
      <div className="fixed inset-4 md:inset-10 z-[80] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Chọn hình ảnh từ Store
            </h3>
            <p className="text-sm text-gray-500">Chọn hoặc upload ảnh mới</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {FOLDERS.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedFolder === folder.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FolderOpen size={14} className="inline mr-1" />
                {folder.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg w-48 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={() => fetchImages()}
              className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              title="Làm mới"
            >
              <RefreshCw size={18} />
            </button>

            <label className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer text-sm">
              {uploading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Upload size={16} />
              )}
              Upload
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-purple-600" size={40} />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FolderOpen size={48} className="mb-2 text-gray-300" />
              <p>Chưa có ảnh nào</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {paginatedImages.map((image) => (
                  <div
                    key={image.path}
                    onClick={() => setSelectedImage(image.url)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImage === image.url
                        ? "border-purple-600 ring-2 ring-purple-300"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedImage === image.url && (
                      <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                        <div className="bg-purple-600 rounded-full p-1">
                          <Check className="text-white" size={16} />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                      <p className="text-[10px] text-white truncate">
                        {image.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .reduce((acc: (number | string)[], page, idx, arr) => {
                        if (idx > 0 && arr[idx - 1] !== page - 1) {
                          acc.push("...");
                        }
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((page, idx) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-1 text-gray-400 text-sm"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className={`w-7 h-7 rounded-lg text-xs font-medium ${
                              currentPage === page
                                ? "bg-purple-600 text-white"
                                : "border border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <span className="ml-2 text-xs text-gray-500">
                    {startIndex + 1}-
                    {Math.min(
                      startIndex + ITEMS_PER_PAGE,
                      filteredImages.length,
                    )}{" "}
                    / {filteredImages.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedImage ? (
              <span className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                Đã chọn 1 ảnh
              </span>
            ) : (
              "Chưa chọn ảnh nào"
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedImage}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={18} />
              Chọn ảnh này
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
