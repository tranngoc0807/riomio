"use client";

import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import type { KeHoachSX, Workshop, SanPham } from "@/lib/googleSheets";

// Interface for selected product in the form
interface SelectedProduct {
  id: string; // unique id for the list
  productCode: string;
  productName: string;
  size: string;
  mainFabric: string;
  color: string;
  image: string;
  // Sizes
  size0_1: number;
  size1_2: number;
  size2_3: number;
  size3_4: number;
  size4_5: number;
  size5_6: number;
  size6_7: number;
  size7_8: number;
  totalQuantity: number;
}

// Interface for grouped LSX (one LSX with multiple products)
interface GroupedLSX {
  lsxCode: string;
  workshop: string;
  orderDate: string;
  completionDate: string;
  note: string;
  products: KeHoachSX[];
  totalQuantity: number;
  productCount: number;
}

const INITIAL_KE_HOACH: Omit<KeHoachSX, "id"> = {
  lsxCode: "",
  workshop: "",
  orderDate: "",
  completionDate: "",
  productCode: "",
  productName: "",
  size: "",
  mainFabric: "",
  color: "",
  image: "",
  size6m: 0, size9m: 0, size0_1: 0, size1_2: 0, size2_3: 0, size3_4: 0,
  size4_5: 0, size5_6: 0, size6_7: 0, size7_8: 0, size8_9: 0, size9_10: 0,
  size10_11: 0, size11_12: 0, size12_13: 0, size13_14: 0, size14_15: 0,
  sizeXS: 0, sizeS: 0, sizeM: 0, sizeL: 0, sizeXL: 0,
  totalQuantity: 0,
  note: "",
};

// Simplified sizes for the table view (based on screenshot)
const TABLE_SIZES = [
  { key: "size0_1", label: "0/1" },
  { key: "size1_2", label: "1/2" },
  { key: "size2_3", label: "2/3" },
  { key: "size3_4", label: "3/4" },
  { key: "size4_5", label: "4/5" },
  { key: "size5_6", label: "5/6" },
  { key: "size6_7", label: "6/7" },
  { key: "size7_8", label: "7/8" },
];

const SIZE_KEYS = [
  "size6m", "size9m", "size0_1", "size1_2", "size2_3", "size3_4",
  "size4_5", "size5_6", "size6_7", "size7_8", "size8_9", "size9_10",
  "size10_11", "size11_12", "size12_13", "size13_14", "size14_15",
  "sizeXS", "sizeS", "sizeM", "sizeL", "sizeXL",
];

const KID_SIZES = [
  { key: "size6m", label: "6m" },
  { key: "size9m", label: "9m" },
  { key: "size0_1", label: "0/1" },
  { key: "size1_2", label: "1/2" },
  { key: "size2_3", label: "2/3" },
  { key: "size3_4", label: "3/4" },
  { key: "size4_5", label: "4/5" },
  { key: "size5_6", label: "5/6" },
  { key: "size6_7", label: "6/7" },
  { key: "size7_8", label: "7/8" },
  { key: "size8_9", label: "8/9" },
  { key: "size9_10", label: "9/10" },
  { key: "size10_11", label: "10/11" },
  { key: "size11_12", label: "11/12" },
  { key: "size12_13", label: "12/13" },
  { key: "size13_14", label: "13/14" },
  { key: "size14_15", label: "14/15" },
];

const ADULT_SIZES = [
  { key: "sizeXS", label: "XS" },
  { key: "sizeS", label: "S" },
  { key: "sizeM", label: "M" },
  { key: "sizeL", label: "L" },
  { key: "sizeXL", label: "XL" },
];

// Format date to dd/mm/yyyy
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";

  // Try to parse the date
  let date: Date;

  // Check if it's already in dd/mm/yy or dd/mm/yyyy format
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      // Handle 2-digit year
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      date = new Date(year, month, day);
    } else {
      return dateStr;
    }
  } else if (dateStr.includes("-")) {
    // ISO format yyyy-mm-dd
    date = new Date(dateStr);
  } else {
    return dateStr;
  }

  if (isNaN(date.getTime())) return dateStr;

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export default function KeHoachSXTab() {
  // Data states
  const [keHoachList, setKeHoachList] = useState<KeHoachSX[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [productCatalog, setProductCatalog] = useState<SanPham[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected item states
  const [selectedItem, setSelectedItem] = useState<KeHoachSX | null>(null);
  const [selectedGroupedLSX, setSelectedGroupedLSX] = useState<GroupedLSX | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null); // LSX code to delete
  const [editItem, setEditItem] = useState<KeHoachSX>({ id: 0, ...INITIAL_KE_HOACH });

  // Edit grouped LSX states
  const [editGroupedLSX, setEditGroupedLSX] = useState<GroupedLSX | null>(null);
  const [editProducts, setEditProducts] = useState<KeHoachSX[]>([]);

  // New: Multi-product form state
  const [formLsxCode, setFormLsxCode] = useState("");
  const [formWorkshop, setFormWorkshop] = useState("");
  const [formOrderDate, setFormOrderDate] = useState("");
  const [formCompletionDate, setFormCompletionDate] = useState("");
  const [formNote, setFormNote] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [workshopSearchTerm, setWorkshopSearchTerm] = useState("");
  const [showWorkshopDropdown, setShowWorkshopDropdown] = useState(false);
  const [editWorkshopSearchTerm, setEditWorkshopSearchTerm] = useState("");
  const [showEditWorkshopDropdown, setShowEditWorkshopDropdown] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [editProductSearchTerm, setEditProductSearchTerm] = useState("");
  const [showEditProductDropdown, setShowEditProductDropdown] = useState(false);

  // Generate next LSX code
  const generateNextLsxCode = (): string => {
    if (keHoachList.length === 0) return "LSX001";
    const lsxNumbers = keHoachList
      .map((k) => {
        const match = k.lsxCode.match(/LSX(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNumber = Math.max(...lsxNumbers, 0);
    return `LSX${(maxNumber + 1).toString().padStart(3, "0")}`;
  };

  // Group data by LSX code
  const groupedByLSX: GroupedLSX[] = useMemo(() => {
    const groups: Record<string, GroupedLSX> = {};

    keHoachList.forEach((item) => {
      if (!groups[item.lsxCode]) {
        groups[item.lsxCode] = {
          lsxCode: item.lsxCode,
          workshop: item.workshop,
          orderDate: item.orderDate,
          completionDate: item.completionDate,
          note: item.note,
          products: [],
          totalQuantity: 0,
          productCount: 0,
        };
      }
      groups[item.lsxCode].products.push(item);
      groups[item.lsxCode].totalQuantity += item.totalQuantity || 0;
      groups[item.lsxCode].productCount += 1;
    });

    return Object.values(groups);
  }, [keHoachList]);

  // Filtered grouped data
  const filteredGroupedList = groupedByLSX.filter((g) =>
    g.lsxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.workshop.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.products.some(p =>
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Legacy filtered list for backward compatibility
  const filteredList = keHoachList.filter((k) =>
    k.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.workshop.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.lsxCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWorkshops = workshops.filter((w) =>
    w.name.toLowerCase().includes(workshopSearchTerm.toLowerCase())
  );

  const filteredEditWorkshops = workshops.filter((w) =>
    w.name.toLowerCase().includes(editWorkshopSearchTerm.toLowerCase())
  );

  const filteredProducts = productCatalog.filter((p) =>
    p.code.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const filteredEditProducts = productCatalog.filter((p) =>
    p.code.toLowerCase().includes(editProductSearchTerm.toLowerCase())
  );

  // Fetch data on mount
  useEffect(() => {
    fetchKeHoachSX();
    fetchWorkshops();
    fetchProducts();
  }, []);

  const fetchKeHoachSX = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/ke-hoach-sx");
      const result = await response.json();
      if (result.success) {
        setKeHoachList(result.data);
      } else {
        toast.error("Không thể tải danh sách kế hoạch sản xuất");
      }
    } catch (error) {
      console.error("Error fetching ke hoach SX:", error);
      toast.error("Lỗi khi tải danh sách kế hoạch sản xuất");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const response = await fetch("/api/workshops");
      const result = await response.json();
      if (result.success) {
        setWorkshops(result.data);
      }
    } catch (error) {
      console.error("Error fetching workshops:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/san-pham");
      const result = await response.json();
      if (result.success) {
        setProductCatalog(result.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Handlers
  const handleViewGrouped = (group: GroupedLSX) => {
    setSelectedGroupedLSX(group);
    setShowViewModal(true);
  };

  const handleView = (item: KeHoachSX) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditGrouped = (group: GroupedLSX) => {
    // Set up edit state for the entire grouped LSX
    setEditGroupedLSX({ ...group });
    setEditProducts(group.products.map(p => ({ ...p })));
    setEditWorkshopSearchTerm("");
    setShowEditWorkshopDropdown(false);
    setShowEditModal(true);
  };

  const handleEdit = (item: KeHoachSX) => {
    setEditItem({ ...item });
    setEditWorkshopSearchTerm("");
    setShowEditWorkshopDropdown(false);
    setEditProductSearchTerm(item.productCode || "");
    setShowEditProductDropdown(false);
    setShowEditModal(true);
  };

  const handleDelete = (id: number) => {
    // Find the LSX code for this item
    const item = keHoachList.find(k => k.id === id);
    if (item) {
      setItemToDelete(item.lsxCode);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteGrouped = (lsxCode: string) => {
    setItemToDelete(lsxCode);
    setShowDeleteModal(true);
  };

  const handleOpenAddModal = () => {
    const newLsxCode = generateNextLsxCode();
    setFormLsxCode(newLsxCode);
    setFormWorkshop("");
    setFormOrderDate("");
    setFormCompletionDate("");
    setFormNote("");
    setSelectedProducts([]);
    setWorkshopSearchTerm("");
    setShowWorkshopDropdown(false);
    setProductSearchTerm("");
    setShowProductDropdown(false);
    setShowAddModal(true);
  };

  // Add product to selected list
  const handleAddProductToList = (product: SanPham) => {
    // Check if already added
    if (selectedProducts.some(p => p.productCode === product.code)) {
      toast.error("Sản phẩm đã được thêm vào danh sách");
      return;
    }

    const newProduct: SelectedProduct = {
      id: `${product.code}-${Date.now()}`,
      productCode: product.code,
      productName: product.name,
      size: product.size || "",
      mainFabric: product.mainFabric || "",
      color: "",
      image: "",
      size0_1: 0,
      size1_2: 0,
      size2_3: 0,
      size3_4: 0,
      size4_5: 0,
      size5_6: 0,
      size6_7: 0,
      size7_8: 0,
      totalQuantity: 0,
    };

    setSelectedProducts([...selectedProducts, newProduct]);
    setProductSearchTerm("");
    setShowProductDropdown(false);
  };

  // Remove product from selected list
  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  // Update product quantity
  const handleUpdateProductQuantity = (id: string, sizeKey: string, value: number) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.id !== id) return p;

      const updated = { ...p, [sizeKey]: Math.max(0, value) };
      // Recalculate total
      updated.totalQuantity =
        updated.size0_1 + updated.size1_2 + updated.size2_3 + updated.size3_4 +
        updated.size4_5 + updated.size5_6 + updated.size6_7 + updated.size7_8;
      return updated;
    }));
  };

  // Update product color
  const handleUpdateProductColor = (id: string, color: string) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.id === id ? { ...p, color } : p
    ));
  };

  // Save multiple products - Sequential to avoid race condition
  const handleAdd = async () => {
    if (!formLsxCode) {
      toast.error("Vui lòng điền LSX số");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm");
      return;
    }

    try {
      setIsAdding(true);

      // Create multiple entries with same LSX code - SEQUENTIAL to avoid race condition
      const results: { success: boolean }[] = [];

      for (const product of selectedProducts) {
        const keHoachData: Omit<KeHoachSX, "id"> = {
          lsxCode: formLsxCode,
          workshop: formWorkshop,
          orderDate: formOrderDate,
          completionDate: formCompletionDate,
          productCode: product.productCode,
          productName: product.productName,
          size: product.size,
          mainFabric: product.mainFabric,
          color: product.color,
          image: product.image,
          size6m: 0,
          size9m: 0,
          size0_1: product.size0_1,
          size1_2: product.size1_2,
          size2_3: product.size2_3,
          size3_4: product.size3_4,
          size4_5: product.size4_5,
          size5_6: product.size5_6,
          size6_7: product.size6_7,
          size7_8: product.size7_8,
          size8_9: 0,
          size9_10: 0,
          size10_11: 0,
          size11_12: 0,
          size12_13: 0,
          size13_14: 0,
          size14_15: 0,
          sizeXS: 0,
          sizeS: 0,
          sizeM: 0,
          sizeL: 0,
          sizeXL: 0,
          totalQuantity: product.totalQuantity,
          note: formNote,
        };

        const response = await fetch("/api/ke-hoach-sx/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(keHoachData),
        });

        const result = await response.json();
        results.push(result);
      }

      const allSuccess = results.every(r => r.success);

      if (allSuccess) {
        await fetchKeHoachSX();
        setShowAddModal(false);
        toast.success(`Thêm ${selectedProducts.length} sản phẩm vào kế hoạch sản xuất thành công`);
      } else {
        toast.error("Có lỗi khi thêm một số sản phẩm");
      }
    } catch (error) {
      console.error("Error adding ke hoach SX:", error);
      toast.error("Lỗi khi thêm kế hoạch sản xuất");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem.lsxCode) {
      toast.error("Vui lòng điền LSX số");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch("/api/ke-hoach-sx/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });

      const result = await response.json();

      if (result.success) {
        await fetchKeHoachSX();
        setShowEditModal(false);
        setEditItem({ id: 0, ...INITIAL_KE_HOACH });
        toast.success("Cập nhật kế hoạch sản xuất thành công");
      } else {
        toast.error(result.error || "Không thể cập nhật kế hoạch sản xuất");
      }
    } catch (error) {
      console.error("Error updating ke hoach SX:", error);
      toast.error("Lỗi khi cập nhật kế hoạch sản xuất");
    } finally {
      setIsUpdating(false);
    }
  };

  // Update edit product quantity
  const handleUpdateEditProductQuantity = (productId: number, sizeKey: string, value: number) => {
    setEditProducts(editProducts.map(p => {
      if (p.id !== productId) return p;

      const updated = { ...p, [sizeKey]: Math.max(0, value) };
      // Recalculate total
      updated.totalQuantity = calculateTotal(updated);
      return updated;
    }));
  };

  // Update edit product color
  const handleUpdateEditProductColor = (productId: number, color: string) => {
    setEditProducts(editProducts.map(p =>
      p.id === productId ? { ...p, color } : p
    ));
  };

  // Update edit grouped LSX info
  const handleUpdateEditGroupedInfo = (field: keyof GroupedLSX, value: string) => {
    if (editGroupedLSX) {
      setEditGroupedLSX({ ...editGroupedLSX, [field]: value });
      // Also update all products with the same info
      setEditProducts(editProducts.map(p => ({ ...p, [field]: value })));
    }
  };

  // Save all edited products
  const handleSaveEditGrouped = async () => {
    if (!editGroupedLSX) return;

    try {
      setIsUpdating(true);

      // Update all products sequentially
      for (const product of editProducts) {
        // Update product with common LSX info
        const updatedProduct = {
          ...product,
          workshop: editGroupedLSX.workshop,
          orderDate: editGroupedLSX.orderDate,
          completionDate: editGroupedLSX.completionDate,
          note: editGroupedLSX.note,
        };

        const response = await fetch("/api/ke-hoach-sx/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProduct),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(result.error || "Có lỗi khi cập nhật một số sản phẩm");
        }
      }

      await fetchKeHoachSX();
      setShowEditModal(false);
      setEditGroupedLSX(null);
      setEditProducts([]);
      toast.success(`Cập nhật lệnh sản xuất ${editGroupedLSX.lsxCode} thành công (${editProducts.length} sản phẩm)`);
    } catch (error) {
      console.error("Error updating ke hoach SX:", error);
      toast.error("Lỗi khi cập nhật kế hoạch sản xuất");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;

    try {
      setIsDeleting(true);

      // Find all items with the same LSX code
      const itemsToDelete = keHoachList.filter(k => k.lsxCode === itemToDelete);

      // Delete all items with the same LSX code sequentially
      for (const item of itemsToDelete) {
        const response = await fetch(`/api/ke-hoach-sx/delete?id=${item.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (!result.success) {
          toast.error(result.error || "Có lỗi khi xóa một số sản phẩm");
        }
      }

      await fetchKeHoachSX();
      setShowDeleteModal(false);
      setItemToDelete(null);
      toast.success(`Xóa lệnh sản xuất ${itemToDelete} thành công (${itemsToDelete.length} sản phẩm)`);
    } catch (error) {
      console.error("Error deleting ke hoach SX:", error);
      toast.error("Lỗi khi xóa kế hoạch sản xuất");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate total quantity
  const calculateTotal = (item: any): number => {
    return SIZE_KEYS.reduce((sum, key) => sum + (item[key] || 0), 0);
  };

  // Update size and recalculate total (for edit modal)
  const updateSize = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    item: any,
    key: string,
    value: number
  ) => {
    const updated = { ...item, [key]: value };
    const total = calculateTotal(updated);
    setter({ ...updated, totalQuantity: total });
  };

  // Calculate total for all selected products
  const totalAllProducts = selectedProducts.reduce((sum, p) => sum + p.totalQuantity, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            Danh sách lệnh sản xuất ({filteredGroupedList.length})
          </h3>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm Mã SP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Thêm lệnh SX
        </button>
      </div>

      {/* Table - Grouped by LSX */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">LSX số</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">Xưởng SX</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">Ngày gửi</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">Ngày HT</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-500">Số SP</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-500">Tổng SL</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">Ghi chú</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGroupedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Chưa có lệnh sản xuất nào
                  </td>
                </tr>
              ) : (
                filteredGroupedList.map((group) => (
                  <tr key={group.lsxCode} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-blue-600">{group.lsxCode}</td>
                    <td className="px-3 py-3 text-sm text-gray-900">{group.workshop || "-"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{formatDate(group.orderDate)}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{formatDate(group.completionDate)}</td>
                    <td className="px-3 py-3 text-sm text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {group.productCount}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-center font-medium text-gray-900">
                      {group.totalQuantity > 0 ? group.totalQuantity.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                      {group.note || "-"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewGrouped(group)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditGrouped(group)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteGrouped(group.lsxCode)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal - Full Screen */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Thêm kế hoạch sản xuất</h3>
                <p className="text-sm text-gray-500">Chọn nhiều sản phẩm cho một lệnh sản xuất</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Form fields */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LSX số</label>
                  <input
                    type="text"
                    value={formLsxCode}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-medium text-blue-600"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
                  <input
                    type="text"
                    value={workshopSearchTerm || formWorkshop}
                    onChange={(e) => {
                      setWorkshopSearchTerm(e.target.value);
                      setShowWorkshopDropdown(true);
                      if (!e.target.value) setFormWorkshop("");
                    }}
                    onFocus={() => setShowWorkshopDropdown(true)}
                    onBlur={() => setTimeout(() => setShowWorkshopDropdown(false), 150)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Chọn xưởng..."
                  />
                  {showWorkshopDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredWorkshops.length > 0 ? (
                        filteredWorkshops.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setFormWorkshop(w.name);
                              setWorkshopSearchTerm("");
                              setShowWorkshopDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm"
                          >
                            {w.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy xưởng</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày gửi lệnh</label>
                  <input
                    type="date"
                    value={formOrderDate}
                    onChange={(e) => {
                      const newOrderDate = e.target.value;
                      if (formCompletionDate && newOrderDate > formCompletionDate) {
                        toast.error("Ngày gửi lệnh không được sau ngày hoàn thành");
                        return;
                      }
                      setFormOrderDate(newOrderDate);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hoàn thành</label>
                  <input
                    type="date"
                    value={formCompletionDate}
                    onChange={(e) => {
                      const newCompletionDate = e.target.value;
                      if (formOrderDate && newCompletionDate < formOrderDate) {
                        toast.error("Ngày hoàn thành không được trước ngày gửi lệnh");
                        return;
                      }
                      setFormCompletionDate(newCompletionDate);
                    }}
                    min={formOrderDate || undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú..."
                  />
                </div>
              </div>

              {/* Product Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thêm sản phẩm</label>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tìm mã hoặc tên sản phẩm..."
                  />
                  {showProductDropdown && productSearchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleAddProductToList(p)}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm border-b border-gray-100"
                          >
                            <div className="font-medium text-blue-600">{p.code}</div>
                            <div className="text-gray-600">{p.name}</div>
                            <div className="text-xs text-gray-400">
                              Size: {p.size || "-"} | Vải: {p.mainFabric || "-"}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy sản phẩm</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Products Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-yellow-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách sản phẩm ({selectedProducts.length})
                    {selectedProducts.length > 0 && (
                      <span className="ml-2 text-blue-600">- Tổng: {totalAllProducts.toLocaleString("vi-VN")} sản phẩm</span>
                    )}
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-24">Mã SP</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Tên SP</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-20">Dòng size</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-24">Mã vải chính</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-24">Màu sắc</th>
                        {TABLE_SIZES.map((s) => (
                          <th key={s.key} className="px-1 py-2 text-center text-xs font-medium text-gray-500 w-12 bg-yellow-50">
                            {s.label}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-16 bg-yellow-100">Tổng SL</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={16} className="px-4 py-8 text-center text-gray-400">
                            Chưa có sản phẩm nào. Tìm kiếm và chọn sản phẩm ở trên.
                          </td>
                        </tr>
                      ) : (
                        selectedProducts.map((product, index) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-2 py-2 text-sm text-gray-600">{index + 1}</td>
                            <td className="px-2 py-2 text-sm font-medium text-blue-600">{product.productCode}</td>
                            <td className="px-2 py-2 text-sm text-gray-900">{product.productName}</td>
                            <td className="px-2 py-2 text-sm text-gray-600">{product.size || "-"}</td>
                            <td className="px-2 py-2 text-sm text-gray-600">{product.mainFabric || "-"}</td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={product.color}
                                onChange={(e) => handleUpdateProductColor(product.id, e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="Màu"
                              />
                            </td>
                            {TABLE_SIZES.map((s) => (
                              <td key={s.key} className="px-1 py-2 bg-yellow-50/50">
                                <input
                                  type="number"
                                  min="0"
                                  value={(product as any)[s.key] || ""}
                                  onChange={(e) => handleUpdateProductQuantity(product.id, s.key, Number(e.target.value) || 0)}
                                  onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                                  className="w-full px-1 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                            <td className="px-2 py-2 text-center font-medium text-gray-900 bg-yellow-100/50">
                              {product.totalQuantity}
                            </td>
                            <td className="px-2 py-2">
                              <button
                                onClick={() => handleRemoveProduct(product.id)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedProducts.length > 0 && (
                    <span>
                      <strong>{selectedProducts.length}</strong> sản phẩm |
                      Tổng số lượng: <strong className="text-blue-600">{totalAllProducts.toLocaleString("vi-VN")}</strong>
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    disabled={isAdding}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={isAdding || selectedProducts.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                  >
                    {isAdding ? "Đang lưu..." : `Lưu kế hoạch (${selectedProducts.length} SP)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* View Modal - Grouped LSX */}
      {showViewModal && selectedGroupedLSX && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowViewModal(false); setSelectedGroupedLSX(null); }} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết lệnh sản xuất</h3>
                <p className="text-sm text-gray-500">LSX: {selectedGroupedLSX.lsxCode}</p>
              </div>
              <button onClick={() => { setShowViewModal(false); setSelectedGroupedLSX(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* LSX Info */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">LSX số:</span>
                  <p className="font-medium text-blue-600">{selectedGroupedLSX.lsxCode}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Xưởng SX:</span>
                  <p className="font-medium">{selectedGroupedLSX.workshop || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ngày gửi lệnh:</span>
                  <p className="font-medium">{formatDate(selectedGroupedLSX.orderDate)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ngày hoàn thành:</span>
                  <p className="font-medium">{formatDate(selectedGroupedLSX.completionDate)}</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-yellow-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách sản phẩm ({selectedGroupedLSX.productCount})
                    <span className="ml-2 text-blue-600">- Tổng: {selectedGroupedLSX.totalQuantity.toLocaleString("vi-VN")} sản phẩm</span>
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-24">Mã SP</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Tên SP</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-24">Vải chính</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-20">Màu sắc</th>
                        {TABLE_SIZES.map((s) => (
                          <th key={s.key} className="px-1 py-2 text-center text-xs font-medium text-gray-500 w-12 bg-yellow-50">
                            {s.label}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-16 bg-yellow-100">Tổng SL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedGroupedLSX.products.map((product, index) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-2 py-2 text-sm font-medium text-blue-600">{product.productCode}</td>
                          <td className="px-2 py-2 text-sm text-gray-900">{product.productName}</td>
                          <td className="px-2 py-2 text-sm text-gray-600">{product.mainFabric || "-"}</td>
                          <td className="px-2 py-2 text-sm text-gray-600">{product.color || "-"}</td>
                          {TABLE_SIZES.map((s) => (
                            <td key={s.key} className="px-1 py-2 text-sm text-center bg-yellow-50/50">
                              {(product as any)[s.key] || "-"}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-sm text-center font-medium text-gray-900 bg-yellow-100/50">
                            {product.totalQuantity || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Note */}
              {selectedGroupedLSX.note && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Ghi chú:</span>
                  <p className="font-medium">{selectedGroupedLSX.note}</p>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Modal - Grouped LSX */}
      {showEditModal && editGroupedLSX && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowEditModal(false); setEditGroupedLSX(null); setEditProducts([]); }} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Sửa lệnh sản xuất</h3>
                <p className="text-sm text-gray-500">LSX: {editGroupedLSX.lsxCode}</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditGroupedLSX(null); setEditProducts([]); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* LSX Info - Editable */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LSX số</label>
                  <input
                    type="text"
                    value={editGroupedLSX.lsxCode}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-medium text-blue-600"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
                  <input
                    type="text"
                    value={editWorkshopSearchTerm || editGroupedLSX.workshop}
                    onChange={(e) => {
                      setEditWorkshopSearchTerm(e.target.value);
                      setShowEditWorkshopDropdown(true);
                      if (!e.target.value) handleUpdateEditGroupedInfo("workshop", "");
                    }}
                    onFocus={() => setShowEditWorkshopDropdown(true)}
                    onBlur={() => setTimeout(() => setShowEditWorkshopDropdown(false), 150)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Tìm và chọn xưởng..."
                  />
                  {showEditWorkshopDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredEditWorkshops.length > 0 ? (
                        filteredEditWorkshops.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              handleUpdateEditGroupedInfo("workshop", w.name);
                              setEditWorkshopSearchTerm("");
                              setShowEditWorkshopDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-green-50 text-sm"
                          >
                            {w.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy xưởng</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày gửi lệnh</label>
                  <input
                    type="date"
                    value={editGroupedLSX.orderDate}
                    onChange={(e) => {
                      const newOrderDate = e.target.value;
                      if (editGroupedLSX.completionDate && newOrderDate > editGroupedLSX.completionDate) {
                        toast.error("Ngày gửi lệnh không được sau ngày hoàn thành");
                        return;
                      }
                      handleUpdateEditGroupedInfo("orderDate", newOrderDate);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hoàn thành</label>
                  <input
                    type="date"
                    value={editGroupedLSX.completionDate}
                    onChange={(e) => {
                      const newCompletionDate = e.target.value;
                      if (editGroupedLSX.orderDate && newCompletionDate < editGroupedLSX.orderDate) {
                        toast.error("Ngày hoàn thành không được trước ngày gửi lệnh");
                        return;
                      }
                      handleUpdateEditGroupedInfo("completionDate", newCompletionDate);
                    }}
                    min={editGroupedLSX.orderDate || undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <input
                    type="text"
                    value={editGroupedLSX.note}
                    onChange={(e) => handleUpdateEditGroupedInfo("note", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ghi chú..."
                  />
                </div>
              </div>

              {/* Products Table - Editable */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách sản phẩm ({editProducts.length})
                    <span className="ml-2 text-green-600">- Tổng: {editProducts.reduce((sum, p) => sum + (p.totalQuantity || 0), 0).toLocaleString("vi-VN")} sản phẩm</span>
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-24">Mã SP</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Tên SP</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-24">Vải chính</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-24">Màu sắc</th>
                        {TABLE_SIZES.map((s) => (
                          <th key={s.key} className="px-1 py-2 text-center text-xs font-medium text-gray-500 w-12 bg-green-50">
                            {s.label}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-16 bg-green-100">Tổng SL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {editProducts.map((product, index) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-2 py-2 text-sm font-medium text-blue-600">{product.productCode}</td>
                          <td className="px-2 py-2 text-sm text-gray-900">{product.productName}</td>
                          <td className="px-2 py-2 text-sm text-gray-600">{product.mainFabric || "-"}</td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={product.color || ""}
                              onChange={(e) => handleUpdateEditProductColor(product.id, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                              placeholder="Màu"
                            />
                          </td>
                          {TABLE_SIZES.map((s) => (
                            <td key={s.key} className="px-1 py-2 bg-green-50/50">
                              <input
                                type="number"
                                min="0"
                                value={(product as any)[s.key] || ""}
                                onChange={(e) => handleUpdateEditProductQuantity(product.id, s.key, Number(e.target.value) || 0)}
                                onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                                className="w-full px-1 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center font-medium text-gray-900 bg-green-100/50">
                            {product.totalQuantity || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <strong>{editProducts.length}</strong> sản phẩm |
                  Tổng số lượng: <strong className="text-green-600">{editProducts.reduce((sum, p) => sum + (p.totalQuantity || 0), 0).toLocaleString("vi-VN")}</strong>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowEditModal(false); setEditGroupedLSX(null); setEditProducts([]); }}
                    disabled={isUpdating}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEditGrouped}
                    disabled={isUpdating || editProducts.length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                  >
                    {isUpdating ? "Đang lưu..." : `Lưu thay đổi (${editProducts.length} SP)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa kế hoạch sản xuất</h3>
                <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn xóa kế hoạch sản xuất này? Hành động này không thể hoàn tác.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setItemToDelete(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                  >
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
