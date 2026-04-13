"use client";

import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Search,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  X,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface FirebaseImage {
  name: string;
  path: string;
  url: string;
}

const DEFAULT_FOLDERS = [
  { id: "", label: "Thư mục gốc" },
  { id: "san-pham", label: "Sản phẩm" },
  { id: "ke-hoach-sx", label: "Kế hoạch SX" },
];

const ITEMS_PER_PAGE = 24;

interface HinhAnhSanPhamTabProps {
  folders?: { id: string; label: string }[];
  defaultFolder?: string;
}

export default function HinhAnhSanPhamTab({ folders, defaultFolder }: HinhAnhSanPhamTabProps = {}) {
  const FOLDERS = folders || DEFAULT_FOLDERS;
  const [images, setImages] = useState<FirebaseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(defaultFolder || "");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<FirebaseImage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<FirebaseImage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [customFileNames, setCustomFileNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/firebase-storage?folder=${selectedFolder}`);
      const result = await response.json();
      if (result.success) {
        setImages(result.files);
      } else {
        toast.error(result.error || "Không thể tải danh sách ảnh");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [selectedFolder]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    // Initialize custom names with original filenames (without extension)
    setCustomFileNames(fileArray.map((f) => f.name.replace(/\.[^/.]+$/, "")));
    setShowUploadModal(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const customName = customFileNames[i]?.trim();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", selectedFolder);
      if (customName) {
        formData.append("customName", customName);
      }

      try {
        const response = await fetch("/api/firebase-storage", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error("Upload error:", result.error);
        }
      } catch (error) {
        errorCount++;
        console.error("Upload error:", error);
      }
    }

    if (successCount > 0) {
      toast.success(`Đã upload ${successCount} ảnh thành công`);
      fetchImages();
    }
    if (errorCount > 0) {
      toast.error(`Có ${errorCount} ảnh upload thất bại`);
    }

    setUploading(false);
    setShowUploadModal(false);
    setSelectedFiles([]);
    setCustomFileNames([]);
  };

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setSelectedFiles([]);
    setCustomFileNames([]);
  };

  const handleDelete = async (image: FirebaseImage) => {
    try {
      const response = await fetch("/api/firebase-storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: image.path }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Đã xóa ảnh");
        fetchImages();
        setShowDeleteConfirm(null);
      } else {
        toast.error(result.error || "Không thể xóa ảnh");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Lỗi kết nối server");
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success("Đã copy URL");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error("Không thể copy URL");
    }
  };

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedImages = filteredImages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when search term or folder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFolder]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <ImageIcon className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-purple-600">Tổng số ảnh</p>
              <p className="text-2xl font-bold text-purple-700">{images.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FolderOpen className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-blue-600">Thư mục hiện tại</p>
              <p className="text-2xl font-bold text-blue-700">
                {FOLDERS.find((f) => f.id === selectedFolder)?.label}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {FOLDERS.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedFolder === folder.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {folder.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm ảnh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <button
            onClick={() => fetchImages()}
            className="p-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            title="Làm mới"
          >
            <RefreshCw size={18} />
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
            {uploading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Upload size={18} />
            )}
            <span className="hidden sm:inline">Upload ảnh</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-purple-600" size={40} />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ImageIcon className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="text-lg">Chưa có ảnh nào trong thư mục này</p>
          <p className="text-sm mt-2">Hãy upload ảnh để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {paginatedImages.map((image) => (
            <div
              key={image.path}
              className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className="aspect-square cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => copyToClipboard(image.url)}
                  className="p-2 bg-white rounded-lg hover:bg-gray-100"
                  title="Copy URL"
                >
                  {copiedUrl === image.url ? (
                    <Check className="text-green-600" size={18} />
                  ) : (
                    <Copy className="text-gray-700" size={18} />
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(image)}
                  className="p-2 bg-white rounded-lg hover:bg-red-50"
                  title="Xóa"
                >
                  <Trash2 className="text-red-600" size={18} />
                </button>
              </div>
              <div className="p-2 border-t">
                <p className="text-xs text-gray-600 truncate" title={image.name}>
                  {image.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, current, and pages around current
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
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? "bg-purple-600 text-white"
                        : "border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>

          <span className="ml-4 text-sm text-gray-500">
            {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredImages.length)} / {filteredImages.length} ảnh
          </span>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 z-10"
            >
              <X size={20} />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="p-4 border-t bg-gray-50">
              <p className="font-medium text-gray-900 mb-2">{selectedImage.name}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedImage.url}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 border rounded-lg"
                />
                <button
                  onClick={() => copyToClipboard(selectedImage.url)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  {copiedUrl === selectedImage.url ? (
                    <>
                      <Check size={16} /> Đã copy
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy URL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xác nhận xóa ảnh
            </h3>
            <p className="text-gray-600 mb-4">
              Bạn có chắc muốn xóa ảnh &quot;{showDeleteConfirm.name}&quot;? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal - Đặt tên file */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleCancelUpload}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload ảnh ({selectedFiles.length} file)
              </h3>
              <button
                onClick={handleCancelUpload}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Tên gốc: {file.name}</p>
                    <input
                      type="text"
                      value={customFileNames[index] || ""}
                      onChange={(e) => {
                        const newNames = [...customFileNames];
                        newNames[index] = e.target.value;
                        setCustomFileNames(newNames);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Nhập tên file (không cần đuôi)"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelUpload}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={uploading}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang upload...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
