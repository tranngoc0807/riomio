"use client";

import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";

// Types
interface Product {
  id: number;
  code: string;
  // 1. Tên SP
  name: string;
  // 2. Bảng size
  size: string;
  // 3. Hình ảnh
  image: string;
  // 4. Màu sắc
  color: string;
  // 5. Giá bán lẻ
  retailPrice: number;
  // 6. Giá bán sỉ
  wholesalePrice: number;
  // 7. Giá vốn
  costPrice: number;
  // 8. Vải chính
  mainFabric: string;
  // 9. Vải phối
  accentFabric: string;
  // 10. Phụ liệu khác
  otherMaterials: string;
  // 11. Định mức vải chính
  mainFabricQuantity: number;
  // 12. Định mức vải phối 1
  accentFabric1Quantity: number;
  // 13. Định mức vải phối 2
  accentFabric2Quantity: number;
  // 14. Định mức phụ liệu 1
  material1Quantity: number;
  // 15. Định mức phụ liệu 2
  material2Quantity: number;
  // 16. Định mức phụ kiện
  accessoriesQuantity: number;
  // 17. Định mức khác
  otherQuantity: number;
  // 18. Số lượng kế hoạch
  plannedQuantity: number;
  // 19. Số lượng cắt
  cutQuantity: number;
  // 20. Số lượng nhập kho
  warehouseQuantity: number;
  // 21. CĐ Final
  cdFinal: string;
  // 22. CĐ đồng bộ NPL
  cdSyncNPL: string;
  // 23. CĐ sản xuất
  cdProduction: string;
  // 24. Nhập kho
  warehouseEntry: string;
  // Legacy fields
  fullCode: string;
  workshop: string;
}

// Xưởng sản xuất có sẵn
const workshopOptions = [
  "Xưởng may Chị Thu",
  "Xưởng chị Hoa - Gia Lâm",
  "Xưởng chú Tuyển",
  "Ms Liễu TQ",
  "Xưởng Minh Tâm",
  "Xưởng Hồng Phát",
];

// Default values for new product fields
const defaultProductFields = {
  costPrice: 0,
  mainFabric: "",
  accentFabric: "",
  otherMaterials: "",
  mainFabricQuantity: 0,
  accentFabric1Quantity: 0,
  accentFabric2Quantity: 0,
  material1Quantity: 0,
  material2Quantity: 0,
  accessoriesQuantity: 0,
  otherQuantity: 0,
  plannedQuantity: 0,
  cutQuantity: 0,
  warehouseQuantity: 0,
  cdFinal: "",
  cdSyncNPL: "",
  cdProduction: "",
  warehouseEntry: "",
};

// Helper function to create product with all fields
const createProduct = (
  id: number,
  code: string,
  name: string,
  size: string,
  workshop: string = "",
  overrides: Partial<Product> = {}
): Product => ({
  id,
  code,
  name,
  size,
  image: "",
  color: "",
  retailPrice: 0,
  wholesalePrice: 0,
  fullCode: code,
  workshop,
  ...defaultProductFields,
  ...overrides,
});

// Dữ liệu sản phẩm - Bảng mã sản phẩm
const initialProducts: Product[] = [
  createProduct(1, "RM001", "Quần jean bé trai đi học Abert túi hậu phối viền", "6/7-10/11"),
  createProduct(2, "RO001", "Quần jeans bé gái đi học gân dọc quần", "6/7-10/11"),
  createProduct(3, "RM003", "Quần jeans teen nam dài Eric khóa túi gấu sờm", "11/12-15/16"),
  createProduct(4, "RAG1082.4", "Áo phông cộc tay vai trễ dáng rộng basic", "2/3-6/7"),
  createProduct(5, "RO005", "Quần jeans bé gái đi học Violet túi tim", "6/7-10/11"),
  createProduct(6, "RAD1003.8", "Áo dài bé gái tơ hoa cúc Ngọc Ý", "3/4-10/11"),
  createProduct(7, "RO007", "Quần jeans bé gái đi học Ella phối dọc ống", "6/7-10/11"),
  createProduct(8, "RA660.9", "Áo sơ mi cộc tay bé trai Waldo", "6/7-11/12"),
  createProduct(9, "RA696.4", "Sơ mi BT dài tay Amory", "6/7-11/12"),
  createProduct(10, "RM010", "Quần jeans bé trai thời trang Louis vá ống", "6/7-10/11"),
  createProduct(11, "RM011", "Quần jeans bé trai đi học Marcus gân chéo nổi cấn", "6/7-10/11"),
  createProduct(12, "RO011", "Quần jeans bé gái đi học dáng baggy Milcah", "6/7-10/11"),
  createProduct(13, "RAD1003.9", "Áo dài bé gái tơ hoa cúc Ngọc Ý", "3/4-10/11"),
  createProduct(14, "T1380.1", "Tất cổ 7cm", "L-XL"),
  createProduct(15, "RM014", "Quần jeans bé trai thời trang Issac túi hộp bo gấu", "6/7-10/11"),
  createProduct(16, "T1381.1", "Tất cổ thấp phối màu", "L-XL"),
  createProduct(17, "T1380.2", "Tất cổ 7cm", "L-XL"),
  createProduct(18, "T1381.2", "Tất cổ thấp phối màu", "L-XL"),
  createProduct(19, "RM018", "Quần jeans teen nam dài Curtis basic", "S-XL"),
  createProduct(20, "T1380.3", "Tất cổ 7cm", "L-XL"),
  createProduct(21, "T1381.3", "Tất cổ thấp phối màu", "L-XL"),
  createProduct(22, "RM021", "Sooc jeans bé trai Dylan gập gấu", "6/7-10/11"),
  createProduct(23, "RO021", "Sooc jeans bé gái Linda phối túi", "6/7-10/11"),
  createProduct(24, "RQT1260.1", "Quần nỉ da cá BT basic gấu chun", "6/7-11/12"),
  createProduct(25, "RO023", "Sooc jeans bé gái gấu tua rua", "6/7-10/11"),
  createProduct(26, "RA1289.1", "Áo giữ nhiệt cổ 3cm", "7/8-11/12"),
  createProduct(27, "T1380.4", "Tất cổ 7cm", "L-XL"),
  createProduct(28, "T1380.5", "Tất cổ 7cm", "L-XL"),
  createProduct(29, "DP01", "Áo khoác gió 2 lớp", "3/4-11/12,S-L"),
  createProduct(30, "RO028", "Quần jeans teen dáng Baggy co giãn", "S-XL"),
  createProduct(31, "RAD1316.1", "Áo dài BT phối gấm", "3/4-10/11", "Anh Duẩn"),
  createProduct(32, "RAD1006.3", "Áo dài bé gái tơ nhăn chùm hoa Ngọc Lam", "3/4-10/11"),
  createProduct(33, "RO031", "Quần jean bé gái đi học ống suông rộng Luna nơ chéo", "6/7-10/11"),
  createProduct(34, "RO032", "Quần jeans teen suông ống rộng Anthea", "S-XL"),
  createProduct(35, "RAD1385.1", "Áo dài bé cổ lé tay đính khuy dài", "3/4-10/11", "Xưởng may Chị Hà - Định Công"),
  createProduct(36, "RM034", "Sooc jean bé trai thời trang gập gấu", "6/7-10/11"),
  createProduct(37, "RC957.7", "Quần chip đùi vải modal bé gái in hình", "2/3-10/11"),
  createProduct(38, "RO037", "Quần Jeans bé gái đi học Lisa túi đồng hồ phối màu", "6/7-10/11"),
  createProduct(39, "RAD1312.1", "Áo dài BT phối gấm tay áo vát", "3/4-10/11", "Xưởng may Chị Thu"),
  createProduct(40, "RAD1323.1", "Áo dài bé gái tơ thêu cụm hoa", "3/4-10/11"),
  createProduct(41, "RO051", "Short jeans bé gái thời trang Dilys xòe A phối trái vải", "3/4-10/11"),
  createProduct(42, "IG0760", "Chân váy basic Ilaby", ""),
  createProduct(43, "IG0761", "Chân váy xếp ly Ilaby", ""),
  createProduct(44, "IB0807", "Short jeans nam bổ dọc thân Ilaby", ""),
  createProduct(45, "IB0808", "Short jeans nam Ilaby", ""),
  createProduct(46, "RM057", "Quần jeans bé trai đi học Henry", "6/7-10/11"),
  createProduct(47, "RO062", "Short jeans Rosa cạp phối nắp túi", "XS-L"),
  createProduct(48, "RO075", "Sooc jeans bé gái phối chân ren Flora", "3/4-10/11"),
  createProduct(49, "RM076", "Short jeans bé trai cơ bản Galvin", "3/4-7/8"),
  createProduct(50, "RM079", "Short jean bé trai Aurora túi phối trái vải", "3/4-7/8"),
  createProduct(51, "RO079", "Sooc jeans Roxana gấu lượn", "3/4-10/11"),
  createProduct(52, "RM082", "Short jean David túi hậu vuông phối trái vải", "6/7-10/11"),
  createProduct(53, "RM085", "Short jean bé trai Ricard túi thời trang", "6/7-10/11"),
  createProduct(54, "RO087", "Chân váy jeans thời trang Jasmine cạp paper", "3/4-9/10"),
  createProduct(55, "RO089", "Chân váy jeans Azura paper túi ốp trái vải", "3/4-9/10"),
  createProduct(56, "RO090", "Chân váy jean túi tim", "3/4-10/11"),
  createProduct(57, "RM097", "Short jeans straight lơ vê gấu trái vải", "S-XL"),
  createProduct(58, "RM087", "Short jeans bé trai thời trang Pierre", "6/7-10/11"),
  createProduct(59, "RV22101", "Váy thô kẻ thời trang Bella", "3/4-10/11"),
  createProduct(60, "RV22102", "Váy thô đuôi cá đi chơi Happy", "3/4-10/11"),
];

// Format currency
const formatCurrency = (amount: number) => {
  if (amount === 0) return "-";
  return new Intl.NumberFormat("vi-VN").format(amount);
};

// Handle image file to base64
const handleImageFile = (
  file: File,
  callback: (base64: string) => void
) => {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

export default function SanPham() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // New product state
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    code: "",
    name: "",
    size: "",
    workshop: "",
    wholesalePrice: 0,
    retailPrice: 0,
  });

  // Edit product state
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Lock body scroll when edit modal is open
  useEffect(() => {
    if (showEditModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showEditModal]);

  // Filtered and sorted data
  const filteredProducts = products
    .filter(p =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.workshop.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name_asc":
          return a.name.localeCompare(b.name, "vi");
        case "name_desc":
          return b.name.localeCompare(a.name, "vi");
        case "code_asc":
          return a.code.localeCompare(b.code, "vi");
        case "code_desc":
          return b.code.localeCompare(a.code, "vi");
        case "id_asc":
          return a.id - b.id;
        case "id_desc":
          return b.id - a.id;
        default:
          return 0;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handlers
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditProduct({ ...product });
    setShowEditModal(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleAddProduct = () => {
    if (newProduct.code) {
      const product: Product = createProduct(
        Math.max(...products.map(p => p.id), 0) + 1,
        newProduct.code || "",
        newProduct.name || "",
        newProduct.size || "",
        newProduct.workshop || "",
        {
          color: newProduct.color || "",
          retailPrice: newProduct.retailPrice || 0,
          wholesalePrice: newProduct.wholesalePrice || 0,
          costPrice: newProduct.costPrice || 0,
          mainFabric: newProduct.mainFabric || "",
          accentFabric: newProduct.accentFabric || "",
          otherMaterials: newProduct.otherMaterials || "",
          mainFabricQuantity: newProduct.mainFabricQuantity || 0,
          accentFabric1Quantity: newProduct.accentFabric1Quantity || 0,
          accentFabric2Quantity: newProduct.accentFabric2Quantity || 0,
          material1Quantity: newProduct.material1Quantity || 0,
          material2Quantity: newProduct.material2Quantity || 0,
          accessoriesQuantity: newProduct.accessoriesQuantity || 0,
          otherQuantity: newProduct.otherQuantity || 0,
          plannedQuantity: newProduct.plannedQuantity || 0,
          cutQuantity: newProduct.cutQuantity || 0,
          warehouseQuantity: newProduct.warehouseQuantity || 0,
          cdFinal: newProduct.cdFinal || "",
          cdSyncNPL: newProduct.cdSyncNPL || "",
          cdProduction: newProduct.cdProduction || "",
          warehouseEntry: newProduct.warehouseEntry || "",
        }
      );
      setProducts([...products, product]);
      setShowAddModal(false);
      setNewProduct({
        code: "",
        name: "",
        size: "",
        workshop: "",
        wholesalePrice: 0,
        retailPrice: 0,
      });
    }
  };

  const handleSaveEdit = () => {
    if (editProduct) {
      const updatedProduct = { ...editProduct, fullCode: editProduct.code };
      setProducts(products.map(p => p.id === editProduct.id ? updatedProduct : p));
      setShowEditModal(false);
      setEditProduct(null);
    }
  };

  // Stats
  const totalProducts = products.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-purple-600" />
            Sản phẩm
          </h1>
          <p className="text-gray-500 mt-1">Quản lý danh mục sản phẩm</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
          <Download size={20} />
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Có giá bán</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.retailPrice > 0).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chưa có giá</p>
              <p className="text-2xl font-bold text-orange-600">
                {products.filter(p => p.retailPrice === 0).length}
              </p>
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
              {/* Search */}
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm mã SP, tên, xưởng SX..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    setCurrentPage(1);
                  }}
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã SP</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">Tên sản phẩm</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Xưởng SX</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Giá sỉ</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Giá lẻ</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-3 py-3">
                      <span className="text-sm font-medium text-purple-600">{product.code}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">{product.name}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{product.size || "-"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{product.workshop || "-"}</td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(product.wholesalePrice)}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-green-600">
                      {formatCurrency(product.retailPrice)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} / {filteredProducts.length} sản phẩm
              {searchTerm && ` (lọc từ ${products.length} sản phẩm)`}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[36px] h-9 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? "bg-purple-600 text-white"
                              : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-1 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal thêm sản phẩm */}
      {showAddModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thêm sản phẩm mới</h3>
                <p className="text-sm text-gray-500">Nhập thông tin sản phẩm</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Thông tin cơ bản</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">1. Tên sản phẩm *</label>
                      <input
                        type="text"
                        value={newProduct.name || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder=""
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã sản phẩm *</label>
                        <input
                          type="text"
                          value={newProduct.code || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2. Bảng size</label>
                        <input
                          type="text"
                          value={newProduct.size || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder=""
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">3. Hình ảnh</label>
                        <label className="relative block w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors overflow-hidden">
                          {newProduct.image ? (
                            <>
                              <img
                                src={newProduct.image}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-medium">Đổi ảnh</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setNewProduct({ ...newProduct, image: "" });
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-1">
                              <Upload size={20} className="text-gray-400" />
                              <span className="text-xs text-gray-500">Chọn ảnh</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFile(file, (base64) => {
                                  setNewProduct({ ...newProduct, image: base64 });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">4. Màu sắc</label>
                        <input
                          type="text"
                          value={newProduct.color || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="VD: Đỏ, Xanh, Trắng"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin giá */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-3">Thông tin giá</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">5. Giá bán lẻ</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newProduct.retailPrice || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                          setNewProduct({ ...newProduct, retailPrice: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">6. Giá bán sỉ</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newProduct.wholesalePrice || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                          setNewProduct({ ...newProduct, wholesalePrice: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">7. Giá vốn</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newProduct.costPrice || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                          setNewProduct({ ...newProduct, costPrice: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Nguyên vật liệu */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-900 mb-3">Nguyên vật liệu</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">8. Vải chính</label>
                      <input
                        type="text"
                        value={newProduct.mainFabric || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, mainFabric: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="VD: #000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">9. Vải phối</label>
                      <input
                        type="text"
                        value={newProduct.accentFabric || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, accentFabric: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="VD: #000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">10. Phụ liệu khác</label>
                      <input
                        type="text"
                        value={newProduct.otherMaterials || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, otherMaterials: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="VD: #000#"
                      />
                    </div>
                  </div>
                </div>

                {/* Định mức */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-900 mb-3">Định mức</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">11. ĐM vải chính</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newProduct.mainFabricQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setNewProduct({ ...newProduct, mainFabricQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">12. ĐM vải phối 1</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newProduct.accentFabric1Quantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setNewProduct({ ...newProduct, accentFabric1Quantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">13. ĐM vải phối 2</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newProduct.accentFabric2Quantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setNewProduct({ ...newProduct, accentFabric2Quantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">14. ĐM phụ liệu 1</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newProduct.material1Quantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setNewProduct({ ...newProduct, material1Quantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">15. ĐM phụ liệu 2</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newProduct.material2Quantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setNewProduct({ ...newProduct, material2Quantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">16. ĐM phụ kiện</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newProduct.accessoriesQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setNewProduct({ ...newProduct, accessoriesQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">17. ĐM khác</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newProduct.otherQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setNewProduct({ ...newProduct, otherQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Số lượng */}
                <div className="bg-cyan-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-cyan-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">18. SL kế hoạch</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newProduct.plannedQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setNewProduct({ ...newProduct, plannedQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">19. SL cắt</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newProduct.cutQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setNewProduct({ ...newProduct, cutQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">20. SL nhập kho</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newProduct.warehouseQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setNewProduct({ ...newProduct, warehouseQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Chỉ đạo sản xuất */}
                <div className="bg-rose-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-rose-900 mb-3">Chỉ đạo sản xuất</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">21. CĐ Final</label>
                      <input
                        type="text"
                        value={newProduct.cdFinal || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, cdFinal: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nhập CĐ Final"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">22. CĐ đồng bộ NPL</label>
                      <input
                        type="text"
                        value={newProduct.cdSyncNPL || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, cdSyncNPL: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nhập CĐ đồng bộ NPL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">23. CĐ sản xuất</label>
                      <input
                        type="text"
                        value={newProduct.cdProduction || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, cdProduction: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nhập CĐ sản xuất"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">24. Nhập kho</label>
                      <input
                        type="text"
                        value={newProduct.warehouseEntry || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, warehouseEntry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nhập thông tin nhập kho"
                      />
                    </div>
                  </div>
                </div>

                {/* Xưởng sản xuất */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng sản xuất</label>
                  <select
                    value={newProduct.workshop || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, workshop: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Chọn xưởng --</option>
                    {workshopOptions.map(ws => (
                      <option key={ws} value={ws}>{ws}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddProduct}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Thêm sản phẩm
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem chi tiết sản phẩm */}
      {showViewModal && selectedProduct && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => { setShowViewModal(false); setSelectedProduct(null); }}
          />
          <div className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
              <div>
                <p className="text-purple-100 text-sm">Chi tiết sản phẩm (24 trường)</p>
                <h3 className="text-xl font-bold text-white">{selectedProduct.code}</h3>
              </div>
              <button
                onClick={() => { setShowViewModal(false); setSelectedProduct(null); }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <p className="text-lg font-medium text-gray-900">{selectedProduct.name}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {selectedProduct.size && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      Size: {selectedProduct.size}
                    </span>
                  )}
                  {selectedProduct.color && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-700">
                      Màu: {selectedProduct.color}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Hình ảnh sản phẩm */}
                {selectedProduct.image && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ImageIcon size={16} />
                      Hình ảnh sản phẩm
                    </h4>
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Thông tin cơ bản */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Thông tin cơ bản</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">1. Tên SP:</span> <span className="font-medium">{selectedProduct.name}</span></div>
                    <div><span className="text-gray-500">2. Bảng size:</span> <span className="font-medium">{selectedProduct.size || "-"}</span></div>
                    <div><span className="text-gray-500">3. Hình ảnh:</span> <span className="font-medium">{selectedProduct.image ? "Có" : "-"}</span></div>
                    <div><span className="text-gray-500">4. Màu sắc:</span> <span className="font-medium">{selectedProduct.color || "-"}</span></div>
                  </div>
                </div>

                {/* Thông tin giá */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-3">Thông tin giá</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">5. Giá bán lẻ</p>
                      <p className="text-lg font-bold text-green-600">
                        {selectedProduct.retailPrice > 0 ? `${formatCurrency(selectedProduct.retailPrice)}đ` : "-"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">6. Giá bán sỉ</p>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedProduct.wholesalePrice > 0 ? `${formatCurrency(selectedProduct.wholesalePrice)}đ` : "-"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">7. Giá vốn</p>
                      <p className="text-lg font-bold text-gray-700">
                        {selectedProduct.costPrice > 0 ? `${formatCurrency(selectedProduct.costPrice)}đ` : "-"}
                      </p>
                    </div>
                  </div>
                  {selectedProduct.wholesalePrice > 0 && selectedProduct.retailPrice > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200 text-center">
                      <span className="text-sm text-gray-600">Lợi nhuận: </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(selectedProduct.retailPrice - selectedProduct.wholesalePrice)}đ
                        <span className="text-xs ml-1 text-green-500">
                          (+{((selectedProduct.retailPrice - selectedProduct.wholesalePrice) / selectedProduct.wholesalePrice * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Nguyên vật liệu */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-900 mb-3">Nguyên vật liệu</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">8. Vải chính:</span> <span className="font-medium">{selectedProduct.mainFabric || "-"}</span></div>
                    <div><span className="text-gray-500">9. Vải phối:</span> <span className="font-medium">{selectedProduct.accentFabric || "-"}</span></div>
                    <div><span className="text-gray-500">10. Phụ liệu khác:</span> <span className="font-medium">{selectedProduct.otherMaterials || "-"}</span></div>
                  </div>
                </div>

                {/* Định mức */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-900 mb-3">Định mức</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">11. ĐM vải chính:</span> <span className="font-medium">{selectedProduct.mainFabricQuantity || "-"}</span></div>
                    <div><span className="text-gray-500">12. ĐM vải phối 1:</span> <span className="font-medium">{selectedProduct.accentFabric1Quantity || "-"}</span></div>
                    <div><span className="text-gray-500">13. ĐM vải phối 2:</span> <span className="font-medium">{selectedProduct.accentFabric2Quantity || "-"}</span></div>
                    <div><span className="text-gray-500">14. ĐM phụ liệu 1:</span> <span className="font-medium">{selectedProduct.material1Quantity || "-"}</span></div>
                    <div><span className="text-gray-500">15. ĐM phụ liệu 2:</span> <span className="font-medium">{selectedProduct.material2Quantity || "-"}</span></div>
                    <div><span className="text-gray-500">16. ĐM phụ kiện:</span> <span className="font-medium">{selectedProduct.accessoriesQuantity || "-"}</span></div>
                    <div><span className="text-gray-500">17. ĐM khác:</span> <span className="font-medium">{selectedProduct.otherQuantity || "-"}</span></div>
                  </div>
                </div>

                {/* Số lượng */}
                <div className="bg-cyan-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-cyan-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">18. SL kế hoạch:</span> <span className="font-medium">{selectedProduct.plannedQuantity || "-"}</span></div>
                    <div><span className="text-gray-500">19. SL cắt:</span> <span className="font-medium">{selectedProduct.cutQuantity || "-"}</span></div>
                    <div><span className="text-gray-500">20. SL nhập kho:</span> <span className="font-medium">{selectedProduct.warehouseQuantity || "-"}</span></div>
                  </div>
                </div>

                {/* Chỉ đạo sản xuất */}
                <div className="bg-rose-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-rose-900 mb-3">Chỉ đạo sản xuất</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">21. CĐ Final:</span> <span className="font-medium">{selectedProduct.cdFinal || "-"}</span></div>
                    <div><span className="text-gray-500">22. CĐ đồng bộ NPL:</span> <span className="font-medium">{selectedProduct.cdSyncNPL || "-"}</span></div>
                    <div><span className="text-gray-500">23. CĐ sản xuất:</span> <span className="font-medium">{selectedProduct.cdProduction || "-"}</span></div>
                    <div><span className="text-gray-500">24. Nhập kho:</span> <span className="font-medium">{selectedProduct.warehouseEntry || "-"}</span></div>
                  </div>
                </div>

                {/* Xưởng sản xuất */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Xưởng sản xuất</p>
                  <p className="font-semibold text-gray-900">{selectedProduct.workshop || "-"}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowViewModal(false); setSelectedProduct(null); }}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => { setShowViewModal(false); handleEditProduct(selectedProduct); }}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Slide Panel sửa sản phẩm */}
      {showEditModal && editProduct && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => { setShowEditModal(false); setEditProduct(null); }}
          />
          <div className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-[60] flex flex-col border-l border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa sản phẩm</h3>
                <p className="text-sm text-gray-500">Mã: {editProduct.code}</p>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditProduct(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Thông tin cơ bản</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">1. Tên sản phẩm *</label>
                      <input
                        type="text"
                        value={editProduct.name}
                        onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã sản phẩm *</label>
                        <input
                          type="text"
                          value={editProduct.code}
                          onChange={(e) => setEditProduct({ ...editProduct, code: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2. Bảng size</label>
                        <input
                          type="text"
                          value={editProduct.size}
                          onChange={(e) => setEditProduct({ ...editProduct, size: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">3. Hình ảnh</label>
                        <label className="relative block w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors overflow-hidden">
                          {editProduct.image ? (
                            <>
                              <img
                                src={editProduct.image}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-medium">Đổi ảnh</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setEditProduct({ ...editProduct, image: "" });
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-1">
                              <Upload size={20} className="text-gray-400" />
                              <span className="text-xs text-gray-500">Chọn ảnh</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFile(file, (base64) => {
                                  setEditProduct({ ...editProduct, image: base64 });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">4. Màu sắc</label>
                        <input
                          type="text"
                          value={editProduct.color}
                          onChange={(e) => setEditProduct({ ...editProduct, color: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="VD: Đỏ, Xanh, Trắng"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin giá */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-3">Thông tin giá</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">5. Giá bán lẻ</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editProduct.retailPrice || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                          setEditProduct({ ...editProduct, retailPrice: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">6. Giá bán sỉ</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editProduct.wholesalePrice || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                          setEditProduct({ ...editProduct, wholesalePrice: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">7. Giá vốn</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editProduct.costPrice || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                          setEditProduct({ ...editProduct, costPrice: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  {editProduct.wholesalePrice > 0 && editProduct.retailPrice > 0 && (
                    <p className="text-xs text-green-700 mt-2">
                      Lợi nhuận: {formatCurrency(editProduct.retailPrice - editProduct.wholesalePrice)}đ
                      ({((editProduct.retailPrice - editProduct.wholesalePrice) / editProduct.wholesalePrice * 100).toFixed(1)}%)
                    </p>
                  )}
                </div>

                {/* Nguyên vật liệu */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-900 mb-3">Nguyên vật liệu</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">8. Vải chính</label>
                      <input
                        type="text"
                        value={editProduct.mainFabric}
                        onChange={(e) => setEditProduct({ ...editProduct, mainFabric: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">9. Vải phối</label>
                      <input
                        type="text"
                        value={editProduct.accentFabric}
                        onChange={(e) => setEditProduct({ ...editProduct, accentFabric: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">10. Phụ liệu khác</label>
                      <input
                        type="text"
                        value={editProduct.otherMaterials}
                        onChange={(e) => setEditProduct({ ...editProduct, otherMaterials: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Định mức */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-900 mb-3">Định mức</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">11. ĐM vải chính</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editProduct.mainFabricQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setEditProduct({ ...editProduct, mainFabricQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">12. ĐM vải phối 1</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editProduct.accentFabric1Quantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setEditProduct({ ...editProduct, accentFabric1Quantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">13. ĐM vải phối 2</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editProduct.accentFabric2Quantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setEditProduct({ ...editProduct, accentFabric2Quantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">14. ĐM phụ liệu 1</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editProduct.material1Quantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setEditProduct({ ...editProduct, material1Quantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">15. ĐM phụ liệu 2</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editProduct.material2Quantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setEditProduct({ ...editProduct, material2Quantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">16. ĐM phụ kiện</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editProduct.accessoriesQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setEditProduct({ ...editProduct, accessoriesQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">17. ĐM khác</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editProduct.otherQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setEditProduct({ ...editProduct, otherQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Số lượng */}
                <div className="bg-cyan-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-cyan-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">18. SL kế hoạch</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editProduct.plannedQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditProduct({ ...editProduct, plannedQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">19. SL cắt</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editProduct.cutQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditProduct({ ...editProduct, cutQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">20. SL nhập kho</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editProduct.warehouseQuantity || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditProduct({ ...editProduct, warehouseQuantity: val ? Number(val) : 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Chỉ đạo sản xuất */}
                <div className="bg-rose-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-rose-900 mb-3">Chỉ đạo sản xuất</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">21. CĐ Final</label>
                      <input
                        type="text"
                        value={editProduct.cdFinal}
                        onChange={(e) => setEditProduct({ ...editProduct, cdFinal: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">22. CĐ đồng bộ NPL</label>
                      <input
                        type="text"
                        value={editProduct.cdSyncNPL}
                        onChange={(e) => setEditProduct({ ...editProduct, cdSyncNPL: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">23. CĐ sản xuất</label>
                      <input
                        type="text"
                        value={editProduct.cdProduction}
                        onChange={(e) => setEditProduct({ ...editProduct, cdProduction: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">24. Nhập kho</label>
                      <input
                        type="text"
                        value={editProduct.warehouseEntry}
                        onChange={(e) => setEditProduct({ ...editProduct, warehouseEntry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Xưởng sản xuất */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng sản xuất</label>
                  <select
                    value={editProduct.workshop}
                    onChange={(e) => setEditProduct({ ...editProduct, workshop: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Chọn xưởng --</option>
                    {workshopOptions.map(ws => (
                      <option key={ws} value={ws}>{ws}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowEditModal(false); setEditProduct(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
