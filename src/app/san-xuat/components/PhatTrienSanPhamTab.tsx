"use client";

import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import ImagePickerModal from "@/components/ImagePickerModal";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

// Types - khớp với Google Sheets PhatTrienSanPham
interface SanPham {
  id: number;
  code: string;
  name: string;
  size: string;
  mainFabric: string;
  accentFabric: string;
  otherMaterials: string;
  productionOrder: string;
  workshop: string;
  mainFabricQuota: string;
  accentFabricQuota1: string;
  accentFabricQuota2: string;
  materialsQuota1: string;
  materialsQuota2: string;
  accessoriesQuota: string;
  otherQuota: string;
  plannedQuantity: number;
  cutQuantity: number;
  warehouseQuantity: number;
  developmentStage: string;
  productionStage: string;
  image: string;
}

// Size options
const sizeOptions = [
  "1/2-6/7", "2/3-5/6", "2/3-6/7", "2/3-7/8", "2/3-8/9", "2/3-9/10",
  "2/3-10/11", "2/3-11/12", "2/3-12/13", "2/3-13/14", "2/3-14/15",
  "3/4-5/6", "3/4-6/7", "3/4-7/8", "3/4-8/9", "3/4-9/10", "3/4-10/11",
  "3/4-11/12", "3/4-12/13", "4/5-10/11", "4/5-11/12", "4/5-12/13",
  "5/6-10/11", "5/6-11/12", "5/6-12/13", "5/6-13/14", "6/7-10/11",
  "6/7-11/12", "6/7-12/13", "6/7-13/14", "7/8-10/11", "7/8-11/12",
  "7/8-12/13", "7/8-13/14", "8/9-11/12", "8/9-12/13", "8/9-13/14",
  "8/9-14/14", "10/11-13/14", "11/12-15/16", "XS-L", "S-XL", "M-XL",
  "L-XL", "S-L", "1 size", "0/1-7/8",
];

// Công đoạn sản xuất options
const productionStageOptions = [
  "Phát triển", "Mẫu đạt", "Huỷ mẫu", "Lệnh sản xuất",
  "Đồng bộ NPL", "Đang sản xuất", "Nhập kho 1 phần", "Nhập kho toàn bộ",
];

export default function PhatTrienSanPhamTab() {
  const [products, setProducts] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SanPham | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [newProduct, setNewProduct] = useState<Partial<SanPham>>({
    code: "", name: "", size: "", mainFabric: "", accentFabric: "",
    otherMaterials: "", productionOrder: "", workshop: "", mainFabricQuota: "",
    accentFabricQuota1: "", accentFabricQuota2: "", materialsQuota1: "",
    materialsQuota2: "", accessoriesQuota: "", otherQuota: "",
    plannedQuantity: 0, cutQuantity: 0, warehouseQuantity: 0,
    developmentStage: "", productionStage: "", image: "",
  });

  const [editProduct, setEditProduct] = useState<SanPham | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<"add" | "edit">("add");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/san-pham");
      const result = await response.json();
      if (result.success) {
        setProducts(result.data);
      } else {
        toast.error(result.error || "Không thể tải dữ liệu sản phẩm");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (showEditModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showEditModal]);

  const filteredProducts = products
    .filter((p) =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.workshop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.productionStage || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.developmentStage || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name_asc": return a.name.localeCompare(b.name, "vi");
        case "name_desc": return b.name.localeCompare(a.name, "vi");
        case "code_asc": return a.code.localeCompare(b.code, "vi");
        case "code_desc": return b.code.localeCompare(a.code, "vi");
        case "id_asc": return a.id - b.id;
        case "id_desc": return b.id - a.id;
        default: return 0;
      }
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleViewProduct = (product: SanPham) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: SanPham) => {
    setEditProduct({ ...product });
    setShowEditModal(true);
  };

  const handleDeleteProduct = (id: number) => {
    setProductToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      const response = await fetch(`/api/san-pham/delete?id=${productToDelete}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        toast.success("Đã xóa sản phẩm thành công");
        fetchProducts();
      } else {
        toast.error(result.error || "Không thể xóa sản phẩm");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Lỗi kết nối server");
    }
    setProductToDelete(null);
  };

  const closeAddModal = () => { setShowAddModal(false); };
  const closeViewModal = () => { setShowViewModal(false); setSelectedProduct(null); };
  const closeEditModal = () => { setShowEditModal(false); setEditProduct(null); };

  const fetchProductInfoByCode = async (code: string) => {
    if (!code || code.trim() === "") return;
    setIsAutoFilling(true);
    try {
      const response = await fetch(`/api/san-pham/get-info-by-code?code=${encodeURIComponent(code)}`);
      const data = await response.json();
      if (data.success && data.data) {
        setNewProduct((prev) => ({
          ...prev,
          workshop: data.data.workshop,
          mainFabricQuota: data.data.mainFabricQuota,
          accentFabricQuota1: data.data.accentFabricQuota1,
          accentFabricQuota2: data.data.accentFabricQuota2,
          materialsQuota1: data.data.materialsQuota1,
          materialsQuota2: data.data.materialsQuota2,
          accessoriesQuota: data.data.accessoriesQuota,
          otherQuota: data.data.otherQuota,
          plannedQuantity: data.data.plannedQuantity,
          cutQuantity: data.data.cutQuantity,
        }));
      }
    } catch (error) {
      console.error("Error fetching product info:", error);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.code && !newProduct.name) {
      toast.error("Vui lòng điền Mã SP hoặc Tên SP");
      return;
    }
    try {
      setSaving(true);
      const response = await fetch("/api/san-pham/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Đã thêm sản phẩm thành công");
        setNewProduct({
          code: "", name: "", size: "", mainFabric: "", accentFabric: "",
          otherMaterials: "", productionOrder: "", workshop: "", mainFabricQuota: "",
          accentFabricQuota1: "", accentFabricQuota2: "", materialsQuota1: "",
          materialsQuota2: "", accessoriesQuota: "", otherQuota: "",
          plannedQuantity: 0, cutQuantity: 0, warehouseQuantity: 0,
          developmentStage: "", productionStage: "", image: "",
        });
        closeAddModal();
      } else {
        toast.error(result.error || "Không thể thêm sản phẩm");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;
    try {
      setSaving(true);
      const response = await fetch("/api/san-pham/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProduct),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Đã cập nhật sản phẩm thành công");
        closeEditModal();
      } else {
        toast.error(result.error || "Không thể cập nhật sản phẩm");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const totalProducts = products.length;
  const inProductionCount = products.filter(
    (p) =>
      (p.productionStage || "").toLowerCase().includes("đang sản xuất") ||
      (p.developmentStage || "").toLowerCase().includes("đang phát triển")
  ).length;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("hoàn thành")) return "bg-green-100 text-green-700";
    if (s.includes("đang sản xuất") || s.includes("đang phát triển")) return "bg-blue-100 text-blue-700";
    if (s.includes("sẵn sàng")) return "bg-purple-100 text-purple-700";
    if (s.includes("tạm dừng")) return "bg-red-100 text-red-700";
    if (s.includes("chờ")) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Package className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đang phát triển/SX</p>
              <p className="text-2xl font-bold text-blue-600">{inProductionCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Search & Actions */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm mã SP, tên, xưởng SX, trạng thái..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={sortOption}
                  onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm min-w-[180px]"
                >
                  <option value="default">Mặc định</option>
                  <option value="name_asc">Tên A → Z</option>
                  <option value="name_desc">Tên Z → A</option>
                  <option value="code_asc">Mã SP A → Z</option>
                  <option value="code_desc">Mã SP Z → A</option>
                  <option value="id_asc">Cũ nhất trước</option>
                  <option value="id_desc">Mới nhất trước</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              Thêm sản phẩm
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã SP</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">Tên sản phẩm</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vải chính</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tình trạng SX</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Xưởng SX</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                          {searchTerm ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có dữ liệu sản phẩm"}
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((product, index) => (
                        <tr key={product.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewProduct(product)}>
                          <td className="px-3 py-3 text-sm text-gray-500">{startIndex + index + 1}</td>
                          <td className="px-3 py-3"><span className="text-sm font-medium text-purple-600">{product.code || "-"}</span></td>
                          <td className="px-3 py-3 text-sm text-gray-900">{product.name || "-"}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{product.size || "-"}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{product.mainFabric || "-"}</td>
                          <td className="px-3 py-3">
                            {product.productionStage ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.productionStage)}`}>
                                {product.productionStage}
                              </span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600">{product.workshop || "-"}</td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEditProduct(product)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Sửa">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Xóa">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Hiển thị {filteredProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredProducts.length)} / {filteredProducts.length} sản phẩm
                  {searchTerm && ` (lọc từ ${products.length} sản phẩm)`}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button key={page} onClick={() => setCurrentPage(page)} className={`min-w-[36px] h-9 rounded-lg font-medium transition-colors ${currentPage === page ? "bg-purple-600 text-white" : "border border-gray-300 hover:bg-gray-50 text-gray-700"}`}>
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-1 text-gray-400">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal thêm sản phẩm */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={closeAddModal} />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thêm sản phẩm mới</h3>
                <p className="text-sm text-gray-500">Phát triển sản phẩm</p>
              </div>
              <button onClick={closeAddModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {isAutoFilling && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700 flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Đang tải thông tin tự động...</p>
                </div>
              )}
              <div className="space-y-4">
                {/* Mã SP & Tên SP */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP *</label>
                    <input type="text" value={newProduct.code || ""} onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value.toUpperCase() })} onBlur={(e) => fetchProductInfoByCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="VD: RM001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên SP *</label>
                    <input type="text" value={newProduct.name || ""} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Nhập tên sản phẩm" />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select value={newProduct.size || ""} onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">-- Chọn size --</option>
                    {sizeOptions.map((size) => (<option key={size} value={size}>{size}</option>))}
                  </select>
                </div>

                {/* Vải chính & Vải phối */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vải chính</label>
                    <input type="text" value={newProduct.mainFabric || ""} onChange={(e) => setNewProduct({ ...newProduct, mainFabric: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="VD: Jeans cotton" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vải phối</label>
                    <input type="text" value={newProduct.accentFabric || ""} onChange={(e) => setNewProduct({ ...newProduct, accentFabric: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="VD: Thun" />
                  </div>
                </div>

                {/* Phụ liệu khác */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phụ liệu khác</label>
                  <input type="text" value={newProduct.otherMaterials || ""} onChange={(e) => setNewProduct({ ...newProduct, otherMaterials: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="VD: Khóa, nút, chỉ" />
                </div>

                {/* Lệnh SX & Xưởng SX */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lệnh SX</label>
                    <input type="text" value={newProduct.productionOrder || ""} onChange={(e) => setNewProduct({ ...newProduct, productionOrder: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="VD: LSX001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
                    <input type="text" value={newProduct.workshop || ""} onChange={(e) => setNewProduct({ ...newProduct, workshop: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Xưởng sản xuất" />
                  </div>
                </div>

                {/* Định mức */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Định mức</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Vải chính</label>
                      <input type="text" value={newProduct.mainFabricQuota || ""} onChange={(e) => setNewProduct({ ...newProduct, mainFabricQuota: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Vải phối 1</label>
                      <input type="text" value={newProduct.accentFabricQuota1 || ""} onChange={(e) => setNewProduct({ ...newProduct, accentFabricQuota1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Vải phối 2</label>
                      <input type="text" value={newProduct.accentFabricQuota2 || ""} onChange={(e) => setNewProduct({ ...newProduct, accentFabricQuota2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Phụ liệu 1</label>
                      <input type="text" value={newProduct.materialsQuota1 || ""} onChange={(e) => setNewProduct({ ...newProduct, materialsQuota1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Phụ liệu 2</label>
                      <input type="text" value={newProduct.materialsQuota2 || ""} onChange={(e) => setNewProduct({ ...newProduct, materialsQuota2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Phụ kiện</label>
                      <input type="text" value={newProduct.accessoriesQuota || ""} onChange={(e) => setNewProduct({ ...newProduct, accessoriesQuota: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Khác</label>
                      <input type="text" value={newProduct.otherQuota || ""} onChange={(e) => setNewProduct({ ...newProduct, otherQuota: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* Số lượng */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL Kế hoạch</label>
                      <input type="number" value={newProduct.plannedQuantity || ""} onChange={(e) => setNewProduct({ ...newProduct, plannedQuantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL Cắt</label>
                      <input type="number" value={newProduct.cutQuantity || ""} onChange={(e) => setNewProduct({ ...newProduct, cutQuantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL Nhập kho</label>
                      <input type="number" value={newProduct.warehouseQuantity || ""} onChange={(e) => setNewProduct({ ...newProduct, warehouseQuantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* Công đoạn */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Công đoạn</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Công đoạn phát triển</label>
                      <input type="text" value={newProduct.developmentStage || ""} onChange={(e) => setNewProduct({ ...newProduct, developmentStage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Nhập công đoạn" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Công đoạn sản xuất</label>
                      <select value={newProduct.productionStage || ""} onChange={(e) => setNewProduct({ ...newProduct, productionStage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">-- Chọn công đoạn --</option>
                        {productionStageOptions.map((stage) => (<option key={stage} value={stage}>{stage}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hình ảnh */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Hình ảnh</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link hình ảnh</label>
                    <div className="flex gap-2">
                      <input type="text" value={newProduct.image || ""} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Nhập link hình ảnh" />
                      <button type="button" onClick={() => { setImagePickerTarget("add"); setShowImagePicker(true); }} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm font-medium whitespace-nowrap">
                        <ImageIcon size={16} />
                        Chọn ảnh
                      </button>
                    </div>
                    {newProduct.image && (
                      <div className="mt-2">
                        <img src={newProduct.image} alt="Preview" className="h-24 w-24 object-cover rounded-lg border" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button onClick={closeAddModal} className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium" disabled={saving}>Hủy</button>
                <button onClick={handleAddProduct} disabled={saving} className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2">
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "Đang lưu..." : "Thêm sản phẩm"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem chi tiết */}
      {showViewModal && selectedProduct && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={closeViewModal} />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
              <div>
                <p className="text-purple-100 text-sm">Chi tiết sản phẩm</p>
                <h3 className="text-xl font-bold text-white">{selectedProduct.code || selectedProduct.name}</h3>
              </div>
              <button onClick={closeViewModal} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Thông tin cơ bản */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Thông tin cơ bản</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Mã SP:</span><span className="ml-2 font-medium">{selectedProduct.code || "-"}</span></div>
                    <div><span className="text-gray-500">Size:</span><span className="ml-2 font-medium">{selectedProduct.size || "-"}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Tên SP:</span><span className="ml-2 font-medium">{selectedProduct.name || "-"}</span></div>
                    <div><span className="text-gray-500">Vải chính:</span><span className="ml-2 font-medium">{selectedProduct.mainFabric || "-"}</span></div>
                    <div><span className="text-gray-500">Vải phối:</span><span className="ml-2 font-medium">{selectedProduct.accentFabric || "-"}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Phụ liệu khác:</span><span className="ml-2 font-medium">{selectedProduct.otherMaterials || "-"}</span></div>
                    <div><span className="text-gray-500">Lệnh SX:</span><span className="ml-2 font-medium">{selectedProduct.productionOrder || "-"}</span></div>
                    <div><span className="text-gray-500">Xưởng SX:</span><span className="ml-2 font-medium">{selectedProduct.workshop || "-"}</span></div>
                  </div>
                </div>

                {/* Định mức */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Định mức</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">ĐM Vải chính:</span><span className="ml-2 font-medium">{selectedProduct.mainFabricQuota || "-"}</span></div>
                    <div><span className="text-gray-500">ĐM Vải phối 1:</span><span className="ml-2 font-medium">{selectedProduct.accentFabricQuota1 || "-"}</span></div>
                    <div><span className="text-gray-500">ĐM Vải phối 2:</span><span className="ml-2 font-medium">{selectedProduct.accentFabricQuota2 || "-"}</span></div>
                    <div><span className="text-gray-500">ĐM Phụ liệu 1:</span><span className="ml-2 font-medium">{selectedProduct.materialsQuota1 || "-"}</span></div>
                    <div><span className="text-gray-500">ĐM Phụ liệu 2:</span><span className="ml-2 font-medium">{selectedProduct.materialsQuota2 || "-"}</span></div>
                    <div><span className="text-gray-500">ĐM Phụ kiện:</span><span className="ml-2 font-medium">{selectedProduct.accessoriesQuota || "-"}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">ĐM Khác:</span><span className="ml-2 font-medium">{selectedProduct.otherQuota || "-"}</span></div>
                  </div>
                </div>

                {/* Số lượng */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">SL Kế hoạch:</span><span className="ml-2 font-medium">{selectedProduct.plannedQuantity || "-"}</span></div>
                    <div><span className="text-gray-500">SL Cắt:</span><span className="ml-2 font-medium">{selectedProduct.cutQuantity || "-"}</span></div>
                    <div><span className="text-gray-500">SL Nhập kho:</span><span className="ml-2 font-medium">{selectedProduct.warehouseQuantity || "-"}</span></div>
                  </div>
                </div>

                {/* Công đoạn */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Công đoạn</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">CĐ phát triển:</span><span className="ml-2 font-medium">{selectedProduct.developmentStage || "-"}</span></div>
                    <div><span className="text-gray-500">CĐ sản xuất:</span>
                      {selectedProduct.productionStage ? (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedProduct.productionStage)}`}>{selectedProduct.productionStage}</span>
                      ) : <span className="ml-2 text-gray-400">-</span>}
                    </div>
                  </div>
                </div>

                {/* Hình ảnh */}
                {selectedProduct.image && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Hình ảnh</h4>
                    <div className="mt-2">
                      <a href={selectedProduct.image} target="_blank" rel="noopener noreferrer">
                        <img
                          src={selectedProduct.image}
                          alt={selectedProduct.name || "Ảnh sản phẩm"}
                          className="max-w-full max-h-64 object-contain rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                        />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button onClick={closeViewModal} className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">Đóng</button>
                <button onClick={() => { closeViewModal(); handleEditProduct(selectedProduct); }} className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2">
                  <Edit size={18} />Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal chỉnh sửa */}
      {showEditModal && editProduct && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={closeEditModal} />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa sản phẩm</h3>
                <p className="text-sm text-gray-500">{editProduct.code || editProduct.name}</p>
              </div>
              <button onClick={closeEditModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Mã SP & Tên SP */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
                    <input type="text" value={editProduct.code || ""} onChange={(e) => setEditProduct({ ...editProduct, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên SP</label>
                    <input type="text" value={editProduct.name || ""} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select value={editProduct.size || ""} onChange={(e) => setEditProduct({ ...editProduct, size: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">-- Chọn size --</option>
                    {sizeOptions.map((size) => (<option key={size} value={size}>{size}</option>))}
                  </select>
                </div>

                {/* Vải chính & Vải phối */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vải chính</label>
                    <input type="text" value={editProduct.mainFabric || ""} onChange={(e) => setEditProduct({ ...editProduct, mainFabric: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vải phối</label>
                    <input type="text" value={editProduct.accentFabric || ""} onChange={(e) => setEditProduct({ ...editProduct, accentFabric: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>

                {/* Phụ liệu khác */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phụ liệu khác</label>
                  <input type="text" value={editProduct.otherMaterials || ""} onChange={(e) => setEditProduct({ ...editProduct, otherMaterials: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>

                {/* Lệnh SX & Xưởng SX */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lệnh SX</label>
                    <input type="text" value={editProduct.productionOrder || ""} onChange={(e) => setEditProduct({ ...editProduct, productionOrder: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
                    <input type="text" value={editProduct.workshop || ""} onChange={(e) => setEditProduct({ ...editProduct, workshop: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>

                {/* Định mức */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Định mức</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Vải chính</label>
                      <input type="text" value={editProduct.mainFabricQuota || ""} onChange={(e) => setEditProduct({ ...editProduct, mainFabricQuota: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Vải phối 1</label>
                      <input type="text" value={editProduct.accentFabricQuota1 || ""} onChange={(e) => setEditProduct({ ...editProduct, accentFabricQuota1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Vải phối 2</label>
                      <input type="text" value={editProduct.accentFabricQuota2 || ""} onChange={(e) => setEditProduct({ ...editProduct, accentFabricQuota2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Phụ liệu 1</label>
                      <input type="text" value={editProduct.materialsQuota1 || ""} onChange={(e) => setEditProduct({ ...editProduct, materialsQuota1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Phụ liệu 2</label>
                      <input type="text" value={editProduct.materialsQuota2 || ""} onChange={(e) => setEditProduct({ ...editProduct, materialsQuota2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Phụ kiện</label>
                      <input type="text" value={editProduct.accessoriesQuota || ""} onChange={(e) => setEditProduct({ ...editProduct, accessoriesQuota: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Khác</label>
                      <input type="text" value={editProduct.otherQuota || ""} onChange={(e) => setEditProduct({ ...editProduct, otherQuota: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Số lượng */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL Kế hoạch</label>
                      <input type="number" value={editProduct.plannedQuantity || ""} onChange={(e) => setEditProduct({ ...editProduct, plannedQuantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL Cắt</label>
                      <input type="number" value={editProduct.cutQuantity || ""} onChange={(e) => setEditProduct({ ...editProduct, cutQuantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL Nhập kho</label>
                      <input type="number" value={editProduct.warehouseQuantity || ""} onChange={(e) => setEditProduct({ ...editProduct, warehouseQuantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Công đoạn */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Công đoạn</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Công đoạn phát triển</label>
                      <input type="text" value={editProduct.developmentStage || ""} onChange={(e) => setEditProduct({ ...editProduct, developmentStage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Công đoạn sản xuất</label>
                      <select value={editProduct.productionStage || ""} onChange={(e) => setEditProduct({ ...editProduct, productionStage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">-- Chọn công đoạn --</option>
                        {productionStageOptions.map((stage) => (<option key={stage} value={stage}>{stage}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hình ảnh */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Hình ảnh</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link hình ảnh</label>
                    <div className="flex gap-2">
                      <input type="text" value={editProduct.image || ""} onChange={(e) => setEditProduct({ ...editProduct, image: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                      <button type="button" onClick={() => { setImagePickerTarget("edit"); setShowImagePicker(true); }} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm font-medium whitespace-nowrap">
                        <ImageIcon size={16} />
                        Chọn ảnh
                      </button>
                    </div>
                    {editProduct.image && (
                      <div className="mt-2">
                        <img src={editProduct.image} alt="Preview" className="h-24 w-24 object-cover rounded-lg border" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button onClick={closeEditModal} className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium" disabled={saving}>Hủy</button>
                <button onClick={handleSaveEdit} disabled={saving} className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2">
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(url) => {
          if (imagePickerTarget === "add") {
            setNewProduct({ ...newProduct, image: url });
          } else if (editProduct) {
            setEditProduct({ ...editProduct, image: url });
          }
        }}
        currentImage={imagePickerTarget === "add" ? newProduct.image : editProduct?.image}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteProduct}
        title="Xóa sản phẩm"
        message="Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </>
  );
}
