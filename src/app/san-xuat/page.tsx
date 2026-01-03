"use client";

import {
  Factory,
  Package,
  Warehouse,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Settings,
  Phone,
  MapPin,
  User,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Portal from "@/components/Portal";
import toast, { Toaster } from "react-hot-toast";
import type { Material, Workshop, Supplier } from "@/lib/googleSheets";

// Dữ liệu sản phẩm sản xuất
const initialProductionItems = [
  {
    id: 1,
    code: "SX001",
    name: "Áo thun cotton",
    plannedQty: 500,
    cuttingQty: 480,
    receivedQty: 450,
    status: "in_progress",
    costPrice: 85000,
  },
  {
    id: 2,
    code: "SX002",
    name: "Quần jean nam",
    plannedQty: 300,
    cuttingQty: 300,
    receivedQty: 280,
    status: "completed",
    costPrice: 150000,
  },
  {
    id: 3,
    code: "SX003",
    name: "Áo sơ mi nữ",
    plannedQty: 400,
    cuttingQty: 0,
    receivedQty: 0,
    status: "pending",
    costPrice: 95000,
  },
  {
    id: 4,
    code: "SX004",
    name: "Váy maxi",
    plannedQty: 200,
    cuttingQty: 180,
    receivedQty: 0,
    status: "cutting",
    costPrice: 180000,
  },
];

export default function SanXuat() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<
    "production" | "materials" | "workshops" | "suppliers"
  >("production");
  const [productionItems, setProductionItems] = useState(
    initialProductionItems
  );
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoadingWorkshops, setIsLoadingWorkshops] = useState(false);
  const [isAddingWorkshop, setIsAddingWorkshop] = useState(false);
  const [isUpdatingWorkshop, setIsUpdatingWorkshop] = useState(false);
  const [isDeletingWorkshop, setIsDeletingWorkshop] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    type: string;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Workshop modal states
  const [showAddWorkshopModal, setShowAddWorkshopModal] = useState(false);
  const [showViewWorkshopModal, setShowViewWorkshopModal] = useState(false);
  const [showEditWorkshopModal, setShowEditWorkshopModal] = useState(false);
  const [showDeleteWorkshopModal, setShowDeleteWorkshopModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(
    null
  );
  const [workshopToDelete, setWorkshopToDelete] = useState<number | null>(null);
  const [newWorkshop, setNewWorkshop] = useState<Omit<Workshop, "id">>({
    name: "",
    phone: "",
    address: "",
    manager: "",
    note: "",
  });
  const [editWorkshop, setEditWorkshop] = useState<Workshop>({
    id: 0,
    name: "",
    phone: "",
    address: "",
    manager: "",
    note: "",
  });

  // Supplier state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [isUpdatingSupplier, setIsUpdatingSupplier] = useState(false);

  // Supplier modal states
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showViewSupplierModal, setShowViewSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [showDeleteSupplierModal, setShowDeleteSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);
  const [isDeletingSupplier, setIsDeletingSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, "id">>({
    name: "",
    material: "",
    address: "",
    contact: "",
    phone: "",
    note: "",
  });
  const [editSupplier, setEditSupplier] = useState<Supplier>({
    id: 0,
    name: "",
    material: "",
    address: "",
    contact: "",
    phone: "",
    note: "",
  });

  // Material modal states
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showViewMaterialModal, setShowViewMaterialModal] = useState(false);
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [showDeleteMaterialModal, setShowDeleteMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [materialToDelete, setMaterialToDelete] = useState<number | null>(null);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isUpdatingMaterial, setIsUpdatingMaterial] = useState(false);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Omit<Material, "id">>({
    code: "",
    name: "",
    supplier: "",
    info: "",
    unit: "",
    priceBeforeTax: 0,
    taxRate: 0,
    priceWithTax: 0,
    image: "",
    note: "",
  });
  const [editMaterial, setEditMaterial] = useState<Material>({
    id: 0,
    code: "",
    name: "",
    supplier: "",
    info: "",
    unit: "",
    priceBeforeTax: 0,
    taxRate: 0,
    priceWithTax: 0,
    image: "",
    note: "",
  });

  // Read tab from URL on mount
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (
      tabFromUrl === "production" ||
      tabFromUrl === "materials" ||
      tabFromUrl === "workshops" ||
      tabFromUrl === "suppliers"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Fetch suppliers from API
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoadingSuppliers(true);
        const response = await fetch("/api/suppliers");
        const result = await response.json();

        if (result.success) {
          setSuppliers(result.data);
        } else {
          toast.error("Không thể tải danh sách nhà cung cấp");
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        toast.error("Lỗi khi tải danh sách nhà cung cấp");
      } finally {
        setIsLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch workshops from API
  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        setIsLoadingWorkshops(true);
        const response = await fetch("/api/workshops");
        const result = await response.json();

        if (result.success) {
          setWorkshops(result.data);
        } else {
          toast.error("Không thể tải danh sách xưởng sản xuất");
        }
      } catch (error) {
        console.error("Error fetching workshops:", error);
        toast.error("Lỗi khi tải danh sách xưởng sản xuất");
      } finally {
        setIsLoadingWorkshops(false);
      }
    };

    fetchWorkshops();
  }, []);

  // Fetch materials on component mount
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoadingMaterials(true);
        const response = await fetch("/api/materials");
        const result = await response.json();

        if (result.success) {
          setMaterials(result.data);
        } else {
          toast.error("Không thể tải danh sách nguyên phụ liệu");
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
        toast.error("Lỗi khi tải danh sách nguyên phụ liệu");
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, []);

  // Update URL when tab changes
  const handleTabChange = (
    tabId: "production" | "materials" | "workshops" | "suppliers"
  ) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  // Filtered data
  const filteredProduction = productionItems.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDeleteItem = (id: number, type: string) => {
    setItemToDelete({ id, type });
    setShowDeleteItemModal(true);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;

    try {
      setIsDeletingItem(true);
      const { id, type } = itemToDelete;
      if (type === "production") {
        setProductionItems(productionItems.filter((p) => p.id !== id));
        toast.success("Xóa kế hoạch sản xuất thành công");
      } else if (type === "material") {
        setMaterials(materials.filter((m) => m.id !== id));
        toast.success("Xóa nguyên phụ liệu thành công");
      }

      setShowDeleteItemModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Lỗi khi xóa");
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Workshop handlers
  const handleViewWorkshop = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setShowViewWorkshopModal(true);
  };

  const handleEditWorkshop = (workshop: Workshop) => {
    setEditWorkshop({ ...workshop });
    setShowEditWorkshopModal(true);
  };

  const handleSaveEditWorkshop = async () => {
    if (editWorkshop.name) {
      try {
        setIsUpdatingWorkshop(true);
        const response = await fetch("/api/workshops/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editWorkshop),
        });

        const result = await response.json();

        if (result.success) {
          setWorkshops(
            workshops.map((w) => (w.id === editWorkshop.id ? editWorkshop : w))
          );
          setShowEditWorkshopModal(false);
          setEditWorkshop({
            id: 0,
            name: "",
            phone: "",
            address: "",
            manager: "",
            note: "",
          });
          toast.success("Cập nhật xưởng sản xuất thành công");
        } else {
          toast.error(result.error || "Không thể cập nhật xưởng sản xuất");
        }
      } catch (error) {
        console.error("Error updating workshop:", error);
        toast.error("Lỗi khi cập nhật xưởng sản xuất");
      } finally {
        setIsUpdatingWorkshop(false);
      }
    }
  };

  const handleAddWorkshop = async () => {
    if (newWorkshop.name) {
      try {
        setIsAddingWorkshop(true);
        const response = await fetch("/api/workshops/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newWorkshop),
        });

        const result = await response.json();

        if (result.success) {
          // Refetch workshops to get the updated list with correct IDs
          const fetchResponse = await fetch("/api/workshops");
          const fetchResult = await fetchResponse.json();

          if (fetchResult.success) {
            setWorkshops(fetchResult.data);
          }

          setNewWorkshop({
            name: "",
            phone: "",
            address: "",
            manager: "",
            note: "",
          });
          setShowAddWorkshopModal(false);
          toast.success("Thêm xưởng sản xuất thành công");
        } else {
          toast.error(result.error || "Không thể thêm xưởng sản xuất");
        }
      } catch (error) {
        console.error("Error adding workshop:", error);
        toast.error("Lỗi khi thêm xưởng sản xuất");
      } finally {
        setIsAddingWorkshop(false);
      }
    }
  };

  const handleDeleteWorkshop = (id: number) => {
    setWorkshopToDelete(id);
    setShowDeleteWorkshopModal(true);
  };

  const confirmDeleteWorkshop = async () => {
    if (workshopToDelete === null) return;

    try {
      setIsDeletingWorkshop(true);
      const response = await fetch("/api/workshops/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workshopToDelete }),
      });

      const result = await response.json();

      if (result.success) {
        // Refetch workshops list to ensure correct IDs
        const fetchResponse = await fetch("/api/workshops");
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success) {
          setWorkshops(fetchResult.data);
        }

        setShowDeleteWorkshopModal(false);
        setWorkshopToDelete(null);
        toast.success("Xóa xưởng sản xuất thành công");
      } else {
        toast.error(result.error || "Không thể xóa xưởng sản xuất");
      }
    } catch (error) {
      console.error("Error deleting workshop:", error);
      toast.error("Lỗi khi xóa xưởng sản xuất");
    } finally {
      setIsDeletingWorkshop(false);
    }
  };

  // Supplier handlers
  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowViewSupplierModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditSupplier({ ...supplier });
    setShowEditSupplierModal(true);
  };

  const handleSaveEditSupplier = async () => {
    if (editSupplier.name) {
      try {
        setIsUpdatingSupplier(true);
        const response = await fetch("/api/suppliers/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editSupplier),
        });

        const result = await response.json();

        if (result.success) {
          setSuppliers(
            suppliers.map((s) => (s.id === editSupplier.id ? editSupplier : s))
          );
          setShowEditSupplierModal(false);
          setEditSupplier({
            id: 0,
            name: "",
            material: "",
            address: "",
            contact: "",
            phone: "",
            note: "",
          });
          toast.success("Cập nhật nhà cung cấp thành công");
        } else {
          toast.error(result.error || "Không thể cập nhật nhà cung cấp");
        }
      } catch (error) {
        console.error("Error updating supplier:", error);
        toast.error("Lỗi khi cập nhật nhà cung cấp");
      } finally {
        setIsUpdatingSupplier(false);
      }
    }
  };

  const handleAddSupplier = async () => {
    if (newSupplier.name) {
      try {
        setIsAddingSupplier(true);
        const response = await fetch("/api/suppliers/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSupplier),
        });

        const result = await response.json();

        if (result.success) {
          // Refetch suppliers to get the updated list with correct IDs
          const fetchResponse = await fetch("/api/suppliers");
          const fetchResult = await fetchResponse.json();

          if (fetchResult.success) {
            setSuppliers(fetchResult.data);
          }

          setNewSupplier({
            name: "",
            material: "",
            address: "",
            contact: "",
            phone: "",
            note: "",
          });
          setShowAddSupplierModal(false);
          toast.success("Thêm nhà cung cấp thành công");
        } else {
          toast.error(result.error || "Không thể thêm nhà cung cấp");
        }
      } catch (error) {
        console.error("Error adding supplier:", error);
        toast.error("Lỗi khi thêm nhà cung cấp");
      } finally {
        setIsAddingSupplier(false);
      }
    }
  };

  const handleDeleteSupplier = (id: number) => {
    setSupplierToDelete(id);
    setShowDeleteSupplierModal(true);
  };

  const confirmDeleteSupplier = async () => {
    if (supplierToDelete === null) return;

    try {
      setIsDeletingSupplier(true);
      const response = await fetch("/api/suppliers/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: supplierToDelete }),
      });

      const result = await response.json();

      if (result.success) {
        // Refetch suppliers to get the updated list with correct IDs
        const fetchResponse = await fetch("/api/suppliers");
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success) {
          setSuppliers(fetchResult.data);
        }

        setShowDeleteSupplierModal(false);
        setSupplierToDelete(null);
        toast.success("Xóa nhà cung cấp thành công");
      } else {
        toast.error(result.error || "Không thể xóa nhà cung cấp");
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Lỗi khi xóa nhà cung cấp");
    } finally {
      setIsDeletingSupplier(false);
    }
  };

  // Material handlers
  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowViewMaterialModal(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditMaterial({ ...material });
    setShowEditMaterialModal(true);
  };

  const handleSaveEditMaterial = async () => {
    // Validate required fields
    const name = editMaterial.name || "";
    if (!name.trim()) {
      toast.error("Vui lòng điền Tên NPL");
      return;
    }

    try {
      setIsUpdatingMaterial(true);
      const response = await fetch("/api/materials/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editMaterial),
      });

      const result = await response.json();

      if (result.success) {
        // Refetch materials list to ensure correct data
        const fetchResponse = await fetch("/api/materials");
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success) {
          setMaterials(fetchResult.data);
        }

        setShowEditMaterialModal(false);
        setEditMaterial({
          id: 0,
          code: "",
          name: "",
          supplier: "",
          info: "",
          unit: "",
          priceBeforeTax: 0,
          taxRate: 0,
          priceWithTax: 0,
          image: "",
          note: "",
        });
        toast.success("Cập nhật nguyên phụ liệu thành công");
      } else {
        toast.error(result.error || "Không thể cập nhật nguyên phụ liệu");
      }
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error("Lỗi khi cập nhật nguyên phụ liệu");
    } finally {
      setIsUpdatingMaterial(false);
    }
  };

  const handleAddMaterial = async () => {
    // Validate required fields
    const name = newMaterial.name || "";
    if (!name.trim()) {
      toast.error("Vui lòng điền Tên NPL");
      return;
    }

    try {
      setIsAddingMaterial(true);
      const response = await fetch("/api/materials/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMaterial),
      });

      const result = await response.json();

      if (result.success) {
        // Refetch materials list to get correct IDs
        const fetchResponse = await fetch("/api/materials");
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success) {
          setMaterials(fetchResult.data);
        }

        setNewMaterial({
          code: "",
          name: "",
          supplier: "",
          info: "",
          unit: "",
          priceBeforeTax: 0,
          taxRate: 0,
          priceWithTax: 0,
          image: "",
          note: "",
        });
        setShowAddMaterialModal(false);
        toast.success("Thêm nguyên phụ liệu thành công");
      } else {
        toast.error(result.error || "Không thể thêm nguyên phụ liệu");
      }
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Lỗi khi thêm nguyên phụ liệu");
    } finally {
      setIsAddingMaterial(false);
    }
  };

  const handleDeleteMaterial = (id: number) => {
    setMaterialToDelete(id);
    setShowDeleteMaterialModal(true);
  };

  const confirmDeleteMaterial = async () => {
    if (materialToDelete === null) return;

    try {
      setIsDeletingMaterial(true);
      const response = await fetch("/api/materials/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: materialToDelete }),
      });

      const result = await response.json();

      if (result.success) {
        // Refetch materials list to ensure correct IDs
        const fetchResponse = await fetch("/api/materials");
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success) {
          setMaterials(fetchResult.data);
        }

        setShowDeleteMaterialModal(false);
        setMaterialToDelete(null);
        toast.success("Xóa nguyên phụ liệu thành công");
      } else {
        toast.error(result.error || "Không thể xóa nguyên phụ liệu");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Lỗi khi xóa nguyên phụ liệu");
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Factory className="w-7 h-7 text-blue-600" />
            Sản xuất
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý sản xuất, nguyên phụ liệu và xưởng sản xuất
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => handleTabChange("production")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "production"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Factory size={20} />
                Kế hoạch sản xuất
              </div>
            </button>
            <button
              onClick={() => handleTabChange("materials")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "materials"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={20} />
                Nguyên phụ liệu
              </div>
            </button>
            <button
              onClick={() => handleTabChange("workshops")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "workshops"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings size={20} />
                Xưởng sản xuất
              </div>
            </button>
            <button
              onClick={() => handleTabChange("suppliers")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "suppliers"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Warehouse size={20} />
                Nhà cung cấp
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Kế hoạch sản xuất */}
          {activeTab === "production" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-md relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Plus size={20} />
                  Thêm lệnh SX
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã SX
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tên sản phẩm
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        SL Kế hoạch
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        SL Cắt
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        SL Nhập kho
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Giá thành
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProduction.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-blue-600">
                          {item.code}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-center text-gray-900">
                          {item.plannedQty}
                        </td>
                        <td className="px-4 py-4 text-sm text-center">
                          <span
                            className={
                              item.cuttingQty < item.plannedQty
                                ? "text-orange-600"
                                : "text-green-600"
                            }
                          >
                            {item.cuttingQty}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-center">
                          <span
                            className={
                              item.receivedQty < item.cuttingQty
                                ? "text-orange-600"
                                : "text-green-600"
                            }
                          >
                            {item.receivedQty}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900">
                          {item.costPrice.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : item.status === "in_progress"
                                ? "bg-blue-100 text-blue-700"
                                : item.status === "cutting"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status === "completed"
                              ? "Hoàn thành"
                              : item.status === "in_progress"
                              ? "Đang SX"
                              : item.status === "cutting"
                              ? "Đang cắt"
                              : "Chờ SX"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewItem(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteItem(item.id, "production")
                              }
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab: Nguyên phụ liệu */}
          {activeTab === "materials" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Danh sách nguyên phụ liệu ({materials.length})
                </h3>
                <button
                  onClick={() => setShowAddMaterialModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm NPL
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-12">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã NPL
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tên NPL
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Nhà cung cấp
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Thông tin
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        ĐVT
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Đơn giá (có thuế)
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMaterials.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">
                          {item.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.supplier || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.info || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.priceWithTax > 0
                            ? `${item.priceWithTax.toLocaleString("vi-VN")}đ`
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewMaterial(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditMaterial(item)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteMaterial(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab: Xưởng sản xuất */}
          {activeTab === "workshops" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Danh sách xưởng sản xuất ({workshops.length})
                </h3>
                <button
                  onClick={() => setShowAddWorkshopModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm xưởng
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-12">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã xưởng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Điện thoại
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Địa chỉ
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Người phụ trách
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Ghi chú
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {workshops.map((workshop, index) => (
                      <tr key={workshop.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {workshop.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {workshop.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          <span className="line-clamp-2">
                            {workshop.address || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {workshop.manager || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          <span className="line-clamp-2">
                            {workshop.note || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewWorkshop(workshop)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditWorkshop(workshop)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkshop(workshop.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab: Nhà cung cấp */}
          {activeTab === "suppliers" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Danh sách nhà cung cấp ({suppliers.length})
                </h3>
                <button
                  onClick={() => setShowAddSupplierModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm NCC
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-12">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tên NCC
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Chất liệu
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Địa chỉ
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Liên hệ
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Điện thoại
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {suppliers.map((supplier, index) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {supplier.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          <span className="line-clamp-2">
                            {supplier.material || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          <span className="line-clamp-2">
                            {supplier.address || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {supplier.contact || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {supplier.phone || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewSupplier(supplier)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditSupplier(supplier)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal xem chi tiết */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chi tiết</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(selectedItem).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between py-2 border-b border-gray-100"
                >
                  <span className="text-gray-500 capitalize">{key}</span>
                  <span className="text-gray-900 font-medium">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedItem(null);
              }}
              className="w-full mt-6 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal thêm xưởng */}
      {showAddWorkshopModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowAddWorkshopModal(false);
              setNewWorkshop({
                name: "",
                phone: "",
                address: "",
                manager: "",
                note: "",
              });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thêm xưởng mới
                </h3>
                <p className="text-sm text-gray-500">
                  Nhập thông tin xưởng sản xuất
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddWorkshopModal(false);
                  setNewWorkshop({
                    name: "",
                    phone: "",
                    address: "",
                    manager: "",
                    note: "",
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên xưởng *
                  </label>
                  <input
                    type="text"
                    value={newWorkshop.name}
                    onChange={(e) =>
                      setNewWorkshop({ ...newWorkshop, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên xưởng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={newWorkshop.phone}
                    onChange={(e) =>
                      setNewWorkshop({ ...newWorkshop, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <textarea
                    value={newWorkshop.address}
                    onChange={(e) =>
                      setNewWorkshop({
                        ...newWorkshop,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người phụ trách
                  </label>
                  <input
                    type="text"
                    value={newWorkshop.manager}
                    onChange={(e) =>
                      setNewWorkshop({
                        ...newWorkshop,
                        manager: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập người phụ trách"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={newWorkshop.note}
                    onChange={(e) =>
                      setNewWorkshop({ ...newWorkshop, note: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú (thông tin TK ngân hàng, ...)"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddWorkshopModal(false);
                    setNewWorkshop({
                      name: "",
                      phone: "",
                      address: "",
                      manager: "",
                      note: "",
                    });
                  }}
                  disabled={isAddingWorkshop}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddWorkshop}
                  disabled={isAddingWorkshop}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingWorkshop ? "Đang thêm..." : "Thêm xưởng"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem xưởng */}
      {showViewWorkshopModal && selectedWorkshop && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowViewWorkshopModal(false);
              setSelectedWorkshop(null);
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin xưởng
                </h3>
                <p className="text-sm text-gray-500">Chi tiết xưởng sản xuất</p>
              </div>
              <button
                onClick={() => {
                  setShowViewWorkshopModal(false);
                  setSelectedWorkshop(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Header với tên xưởng */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Factory className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Tên xưởng</p>
                    <p className="font-semibold text-white text-xl">
                      {selectedWorkshop.name}
                    </p>
                  </div>
                </div>

                {/* Thông tin chi tiết */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Phone className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-semibold text-gray-900">
                        {selectedWorkshop.phone || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <MapPin className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-semibold text-gray-900">
                        {selectedWorkshop.address || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <User className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Người phụ trách</p>
                      <p className="font-semibold text-gray-900">
                        {selectedWorkshop.manager || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  {selectedWorkshop.note && (
                    <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <FileText className="text-yellow-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ghi chú</p>
                        <p className="font-semibold text-gray-900">
                          {selectedWorkshop.note}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewWorkshopModal(false);
                    setSelectedWorkshop(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewWorkshopModal(false);
                    handleEditWorkshop(selectedWorkshop);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sửa thông tin
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa xưởng */}
      {showEditWorkshopModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowEditWorkshopModal(false);
              setEditWorkshop({
                id: 0,
                name: "",
                phone: "",
                address: "",
                manager: "",
                note: "",
              });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sửa thông tin xưởng
                </h3>
                <p className="text-sm text-gray-500">
                  Cập nhật thông tin xưởng sản xuất
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditWorkshopModal(false);
                  setEditWorkshop({
                    id: 0,
                    name: "",
                    phone: "",
                    address: "",
                    manager: "",
                    note: "",
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên xưởng *
                  </label>
                  <input
                    type="text"
                    value={editWorkshop.name}
                    onChange={(e) =>
                      setEditWorkshop({ ...editWorkshop, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên xưởng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editWorkshop.phone}
                    onChange={(e) =>
                      setEditWorkshop({
                        ...editWorkshop,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <textarea
                    value={editWorkshop.address}
                    onChange={(e) =>
                      setEditWorkshop({
                        ...editWorkshop,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người phụ trách
                  </label>
                  <input
                    type="text"
                    value={editWorkshop.manager}
                    onChange={(e) =>
                      setEditWorkshop({
                        ...editWorkshop,
                        manager: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập người phụ trách"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={editWorkshop.note}
                    onChange={(e) =>
                      setEditWorkshop({ ...editWorkshop, note: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú (thông tin TK ngân hàng, ...)"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditWorkshopModal(false);
                    setEditWorkshop({
                      id: 0,
                      name: "",
                      phone: "",
                      address: "",
                      manager: "",
                      note: "",
                    });
                  }}
                  disabled={isUpdatingWorkshop}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditWorkshop}
                  disabled={isUpdatingWorkshop}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingWorkshop ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal thêm NCC */}
      {showAddSupplierModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowAddSupplierModal(false);
              setNewSupplier({
                name: "",
                material: "",
                address: "",
                contact: "",
                phone: "",
                note: "",
              });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thêm nhà cung cấp mới
                </h3>
                <p className="text-sm text-gray-500">
                  Nhập thông tin nhà cung cấp
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddSupplierModal(false);
                  setNewSupplier({
                    name: "",
                    material: "",
                    address: "",
                    contact: "",
                    phone: "",
                    note: "",
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên NCC *
                  </label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nhà cung cấp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chất liệu
                  </label>
                  <input
                    type="text"
                    value={newSupplier.material}
                    onChange={(e) =>
                      setNewSupplier({
                        ...newSupplier,
                        material: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Vải thô, cotton, ren..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <textarea
                    value={newSupplier.address}
                    onChange={(e) =>
                      setNewSupplier({
                        ...newSupplier,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người liên hệ
                  </label>
                  <input
                    type="text"
                    value={newSupplier.contact}
                    onChange={(e) =>
                      setNewSupplier({
                        ...newSupplier,
                        contact: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên người liên hệ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={newSupplier.note}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, note: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú thêm..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddSupplierModal(false);
                    setNewSupplier({
                      name: "",
                      material: "",
                      address: "",
                      contact: "",
                      phone: "",
                      note: "",
                    });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddSupplier}
                  disabled={isAddingSupplier}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingSupplier ? "Đang thêm..." : "Thêm NCC"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem NCC */}
      {showViewSupplierModal && selectedSupplier && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowViewSupplierModal(false);
              setSelectedSupplier(null);
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin NCC
                </h3>
                <p className="text-sm text-gray-500">Chi tiết nhà cung cấp</p>
              </div>
              <button
                onClick={() => {
                  setShowViewSupplierModal(false);
                  setSelectedSupplier(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Header với tên NCC */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Package className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-orange-100">Tên NCC</p>
                    <p className="font-semibold text-white text-xl">
                      {selectedSupplier.name}
                    </p>
                  </div>
                </div>

                {/* Thông tin chi tiết */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Settings className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Chất liệu</p>
                      <p className="font-semibold text-gray-900">
                        {selectedSupplier.material || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <MapPin className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-semibold text-gray-900">
                        {selectedSupplier.address || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <User className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Người liên hệ</p>
                      <p className="font-semibold text-gray-900">
                        {selectedSupplier.contact || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Phone className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-semibold text-gray-900">
                        {selectedSupplier.phone || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  {selectedSupplier.note && (
                    <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <FileText className="text-yellow-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ghi chú</p>
                        <p className="font-semibold text-gray-900">
                          {selectedSupplier.note}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewSupplierModal(false);
                    setSelectedSupplier(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewSupplierModal(false);
                    handleEditSupplier(selectedSupplier);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sửa thông tin
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa NCC */}
      {showEditSupplierModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowEditSupplierModal(false);
              setEditSupplier({
                id: 0,
                name: "",
                material: "",
                address: "",
                contact: "",
                phone: "",
                note: "",
              });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sửa thông tin NCC
                </h3>
                <p className="text-sm text-gray-500">
                  Cập nhật thông tin nhà cung cấp
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditSupplierModal(false);
                  setEditSupplier({
                    id: 0,
                    name: "",
                    material: "",
                    address: "",
                    contact: "",
                    phone: "",
                    note: "",
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên NCC *
                  </label>
                  <input
                    type="text"
                    value={editSupplier.name}
                    onChange={(e) =>
                      setEditSupplier({ ...editSupplier, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nhà cung cấp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chất liệu
                  </label>
                  <input
                    type="text"
                    value={editSupplier.material}
                    onChange={(e) =>
                      setEditSupplier({
                        ...editSupplier,
                        material: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Vải thô, cotton, ren..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <textarea
                    value={editSupplier.address}
                    onChange={(e) =>
                      setEditSupplier({
                        ...editSupplier,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người liên hệ
                  </label>
                  <input
                    type="text"
                    value={editSupplier.contact}
                    onChange={(e) =>
                      setEditSupplier({
                        ...editSupplier,
                        contact: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên người liên hệ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editSupplier.phone}
                    onChange={(e) =>
                      setEditSupplier({
                        ...editSupplier,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={editSupplier.note}
                    onChange={(e) =>
                      setEditSupplier({ ...editSupplier, note: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú thêm..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditSupplierModal(false);
                    setEditSupplier({
                      id: 0,
                      name: "",
                      material: "",
                      address: "",
                      contact: "",
                      phone: "",
                      note: "",
                    });
                  }}
                  disabled={isUpdatingSupplier}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditSupplier}
                  disabled={isUpdatingSupplier}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingSupplier ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa NCC */}
      {showDeleteSupplierModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Xác nhận xóa
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa nhà cung cấp này? Hành động này không
                thể hoàn tác.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteSupplierModal(false);
                    setSupplierToDelete(null);
                  }}
                  disabled={isDeletingSupplier}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteSupplier}
                  disabled={isDeletingSupplier}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingSupplier ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa Item (Production/Material) */}
      {showDeleteItemModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Xác nhận xóa
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn
                tác.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteItemModal(false);
                    setItemToDelete(null);
                  }}
                  disabled={isDeletingItem}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteItem}
                  disabled={isDeletingItem}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingItem ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa Workshop */}
      {showDeleteWorkshopModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Xác nhận xóa
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa xưởng sản xuất này? Hành động này
                không thể hoàn tác.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteWorkshopModal(false);
                    setWorkshopToDelete(null);
                  }}
                  disabled={isDeletingWorkshop}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteWorkshop}
                  disabled={isDeletingWorkshop}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingWorkshop ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa Material */}
      {showDeleteMaterialModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Xác nhận xóa
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa nguyên phụ liệu này? Hành động này
                không thể hoàn tác.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteMaterialModal(false);
                    setMaterialToDelete(null);
                  }}
                  disabled={isDeletingMaterial}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteMaterial}
                  disabled={isDeletingMaterial}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingMaterial ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal thêm NPL */}
      {showAddMaterialModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowAddMaterialModal(false);
              setNewMaterial({
                code: "",
                name: "",
                supplier: "",
                info: "",
                unit: "",
                priceBeforeTax: 0,
                taxRate: 0,
                priceWithTax: 0,
                image: "",
                note: "",
              });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thêm nguyên phụ liệu mới
                </h3>
                <p className="text-sm text-gray-500">
                  Nhập thông tin nguyên phụ liệu
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddMaterialModal(false);
                  setNewMaterial({
                    code: "",
                    name: "",
                    supplier: "",
                    info: "",
                    unit: "",
                    priceBeforeTax: 0,
                    taxRate: 0,
                    priceWithTax: 0,
                    image: "",
                    note: "",
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã NPL *
                  </label>
                  <input
                    type="text"
                    value={newMaterial.code}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: VAI.001, PL.001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên NPL *
                  </label>
                  <input
                    type="text"
                    value={newMaterial.name}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nguyên phụ liệu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhà cung cấp
                  </label>
                  <input
                    type="text"
                    value={newMaterial.supplier}
                    onChange={(e) =>
                      setNewMaterial({
                        ...newMaterial,
                        supplier: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nhà cung cấp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thông tin NPL
                  </label>
                  <input
                    type="text"
                    value={newMaterial.info}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, info: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: K1m50, màu trắng..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    value={newMaterial.unit}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: m, Cuộn, Cái, Gói"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đơn giá (chưa thuế)
                    </label>
                    <input
                      type="number"
                      value={newMaterial.priceBeforeTax || ""}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          priceBeforeTax: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thuế suất (%)
                    </label>
                    <input
                      type="number"
                      value={newMaterial.taxRate || ""}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          taxRate: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn giá (có thuế)
                  </label>
                  <input
                    type="number"
                    value={newMaterial.priceWithTax || ""}
                    onChange={(e) =>
                      setNewMaterial({
                        ...newMaterial,
                        priceWithTax: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={newMaterial.note}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, note: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú thêm..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddMaterialModal(false);
                    setNewMaterial({
                      code: "",
                      name: "",
                      supplier: "",
                      info: "",
                      unit: "",
                      priceBeforeTax: 0,
                      taxRate: 0,
                      priceWithTax: 0,
                      image: "",
                      note: "",
                    });
                  }}
                  disabled={isAddingMaterial}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddMaterial}
                  disabled={isAddingMaterial}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingMaterial ? "Đang thêm..." : "Thêm NPL"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem NPL */}
      {showViewMaterialModal && selectedMaterial && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowViewMaterialModal(false);
              setSelectedMaterial(null);
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin NPL
                </h3>
                <p className="text-sm text-gray-500">
                  Chi tiết nguyên phụ liệu
                </p>
              </div>
              <button
                onClick={() => {
                  setShowViewMaterialModal(false);
                  setSelectedMaterial(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Header với tên NPL */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Package className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-green-100">
                      {selectedMaterial.code}
                    </p>
                    <p className="font-semibold text-white text-xl">
                      {selectedMaterial.name}
                    </p>
                  </div>
                </div>

                {/* Thông tin chi tiết */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Warehouse className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nhà cung cấp</p>
                      <p className="font-semibold text-gray-900">
                        {selectedMaterial.supplier || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Thông tin NPL</p>
                      <p className="font-semibold text-gray-900">
                        {selectedMaterial.info || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Settings className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Đơn vị tính</p>
                      <p className="font-semibold text-gray-900">
                        {selectedMaterial.unit || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">
                        Đơn giá (chưa thuế)
                      </p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {selectedMaterial.priceBeforeTax > 0
                          ? `${selectedMaterial.priceBeforeTax.toLocaleString(
                              "vi-VN"
                            )}đ`
                          : "-"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Thuế suất</p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {selectedMaterial.taxRate}%
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-gray-500">Đơn giá (có thuế)</p>
                    <p className="font-bold text-green-600 text-2xl">
                      {selectedMaterial.priceWithTax > 0
                        ? `${selectedMaterial.priceWithTax.toLocaleString(
                            "vi-VN"
                          )}đ`
                        : "-"}
                    </p>
                  </div>

                  {selectedMaterial.note && (
                    <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <FileText className="text-yellow-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ghi chú</p>
                        <p className="font-semibold text-gray-900">
                          {selectedMaterial.note}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewMaterialModal(false);
                    setSelectedMaterial(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewMaterialModal(false);
                    handleEditMaterial(selectedMaterial);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sửa thông tin
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa NPL */}
      {showEditMaterialModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowEditMaterialModal(false);
              setEditMaterial({
                id: 0,
                code: "",
                name: "",
                supplier: "",
                info: "",
                unit: "",
                priceBeforeTax: 0,
                taxRate: 0,
                priceWithTax: 0,
                image: "",
                note: "",
              });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sửa thông tin NPL
                </h3>
                <p className="text-sm text-gray-500">
                  Cập nhật thông tin nguyên phụ liệu
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditMaterialModal(false);
                  setEditMaterial({
                    id: 0,
                    code: "",
                    name: "",
                    supplier: "",
                    info: "",
                    unit: "",
                    priceBeforeTax: 0,
                    taxRate: 0,
                    priceWithTax: 0,
                    image: "",
                    note: "",
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã NPL *
                  </label>
                  <input
                    type="text"
                    value={editMaterial.code}
                    onChange={(e) =>
                      setEditMaterial({ ...editMaterial, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: VAI.001, PL.001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên NPL *
                  </label>
                  <input
                    type="text"
                    value={editMaterial.name}
                    onChange={(e) =>
                      setEditMaterial({ ...editMaterial, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nguyên phụ liệu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhà cung cấp
                  </label>
                  <input
                    type="text"
                    value={editMaterial.supplier}
                    onChange={(e) =>
                      setEditMaterial({
                        ...editMaterial,
                        supplier: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nhà cung cấp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thông tin NPL
                  </label>
                  <input
                    type="text"
                    value={editMaterial.info}
                    onChange={(e) =>
                      setEditMaterial({ ...editMaterial, info: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: K1m50, màu trắng..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    value={editMaterial.unit}
                    onChange={(e) =>
                      setEditMaterial({ ...editMaterial, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: m, Cuộn, Cái, Gói"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đơn giá (chưa thuế)
                    </label>
                    <input
                      type="number"
                      value={editMaterial.priceBeforeTax || ""}
                      onChange={(e) =>
                        setEditMaterial({
                          ...editMaterial,
                          priceBeforeTax: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thuế suất (%)
                    </label>
                    <input
                      type="number"
                      value={editMaterial.taxRate || ""}
                      onChange={(e) =>
                        setEditMaterial({
                          ...editMaterial,
                          taxRate: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn giá (có thuế)
                  </label>
                  <input
                    type="number"
                    value={editMaterial.priceWithTax || ""}
                    onChange={(e) =>
                      setEditMaterial({
                        ...editMaterial,
                        priceWithTax: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={editMaterial.note}
                    onChange={(e) =>
                      setEditMaterial({ ...editMaterial, note: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú thêm..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditMaterialModal(false);
                    setEditMaterial({
                      id: 0,
                      code: "",
                      name: "",
                      supplier: "",
                      info: "",
                      unit: "",
                      priceBeforeTax: 0,
                      taxRate: 0,
                      priceWithTax: 0,
                      image: "",
                      note: "",
                    });
                  }}
                  disabled={isUpdatingMaterial}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditMaterial}
                  disabled={isUpdatingMaterial}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingMaterial ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
