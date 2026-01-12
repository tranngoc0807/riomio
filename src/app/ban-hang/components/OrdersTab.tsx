"use client";

import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  Printer,
  Download,
} from "lucide-react";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import html2canvas from "html2canvas";

interface Order {
  id: number;
  code: string;
  date: string;
  customer: string;
  productCode: string;
  image: string;
  items: number;
  productPrice: number;
  subtotal: number;
  salesProgram: string;
  discount: string;
  priceAfterDiscount: number;
  subtotalAfterDiscount: number;
  paymentDiscount: string;
  total: number;
  salesUser: string;
  status: "completed" | "processing" | "pending" | "shipping";
  notes: string;
}

// Interface for selected product in the form (multi-product)
interface SelectedProduct {
  id: string; // unique id for the list
  productCode: string;
  productName: string;
  image: string;
  items: number;
  productPrice: number;
  subtotal: number;
  salesProgram: string;
  discount: string;
  priceAfterDiscount: number;
  subtotalAfterDiscount: number;
}

// Interface for grouped orders (one order with multiple products)
interface GroupedOrder {
  orderCode: string;
  date: string;
  customer: string;
  customerCategory: string;
  paymentDiscount: string;
  total: number;
  salesUser: string;
  status: "completed" | "processing" | "pending" | "shipping";
  notes: string;
  products: Order[];
  productCount: number;
  totalItems: number;
}

interface Customer {
  id: number;
  name: string;
  category: string; // NPP, Đại lý, Shop, etc.
}

interface Product {
  id: number;
  code: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
  image: string;
}

interface ProductCatalog {
  name: string;
  retailPrice: number;
  wholesalePrice: number;
  image: string;
}

interface Program {
  id: number;
  code: string;
  discount: string;
  type: string;
}

const INITIAL_ORDER = {
  code: "",
  date: new Date().toISOString().split("T")[0],
  customer: "",
  productCode: "",
  image: "",
  items: 0,
  productPrice: 0,
  subtotal: 0,
  salesProgram: "",
  discount: "",
  priceAfterDiscount: 0,
  subtotalAfterDiscount: 0,
  paymentDiscount: "",
  total: 0,
  salesUser: "",
  status: "pending" as "completed" | "processing" | "pending" | "shipping",
  notes: "",
};

// Helper function to get cached profile from localStorage as fallback
const getCachedProfileName = (): string => {
  try {
    const cached = localStorage.getItem("riomio_profile_cache");
    if (cached) {
      const { profile } = JSON.parse(cached);
      return profile?.full_name || profile?.email || "";
    }
  } catch (e) {
    console.warn("Error reading cached profile:", e);
  }
  return "";
};

export default function OrdersTab() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null); // Order code to delete
  const [viewGroupedOrder, setViewGroupedOrder] = useState<GroupedOrder | null>(null);

  // Print states
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Multi-product form states
  const [formOrderCode, setFormOrderCode] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formPaymentDiscount, setFormPaymentDiscount] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  // Edit grouped order states
  const [editGroupedOrder, setEditGroupedOrder] = useState<GroupedOrder | null>(null);
  const [editProducts, setEditProducts] = useState<Order[]>([]);

  // Dropdown data for order form
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [programsList, setProgramsList] = useState<Program[]>([]);

  // Search states for Add modal
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Refs for click outside
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Filter customers and products
  const filteredCustomers = customersList.filter((c) =>
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const filteredProducts = productsList.filter(
    (p) =>
      p.code.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // Search term for orders table
  const [searchTerm, setSearchTerm] = useState("");

  // Group orders by order code
  const groupedOrders: GroupedOrder[] = useMemo(() => {
    const groups: Record<string, GroupedOrder> = {};

    orders.forEach((order) => {
      if (!groups[order.code]) {
        // Find customer category
        const customer = customersList.find((c) => c.name === order.customer);
        groups[order.code] = {
          orderCode: order.code,
          date: order.date,
          customer: order.customer,
          customerCategory: customer?.category || "",
          paymentDiscount: order.paymentDiscount,
          total: 0,
          salesUser: order.salesUser,
          status: order.status,
          notes: order.notes,
          products: [],
          productCount: 0,
          totalItems: 0,
        };
      }
      groups[order.code].products.push(order);
      groups[order.code].total += order.total || 0;
      groups[order.code].productCount += 1;
      groups[order.code].totalItems += order.items || 0;
    });

    return Object.values(groups);
  }, [orders, customersList]);

  // Filtered grouped orders
  const filteredGroupedOrders = groupedOrders.filter(
    (g) =>
      g.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.products.some((p) =>
        p.productCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/orders");
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      } else {
        console.error("Failed to fetch orders:", result.error);
        toast.error("Không thể tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Lỗi khi tải danh sách đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  const generateNextOrderCode = (existingOrders: Order[]): string => {
    if (existingOrders.length === 0) {
      return "MIO001";
    }

    // Extract numbers from order codes and find the max
    const codeNumbers = existingOrders
      .map((order) => {
        const match = order.code.match(/MIO(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNumber = Math.max(...codeNumbers, 0);
    return `MIO${maxNumber + 1}`;
  };

  const fetchDropdownData = async () => {
    try {
      setIsLoadingDropdownData(true);
      const [customersRes, programsRes, productsRes, productCatalogRes, ordersRes] =
        await Promise.all([
          fetch("/api/customers"),
          fetch("/api/programs"),
          fetch("/api/danh-muc-sp"), // Danh mục SP - lấy Mã SP đầy đủ
          fetch("/api/san-pham-catalog"), // SanPham catalog - có giá và tên
          fetch("/api/orders"),
        ]);

      const customersResult = await customersRes.json();
      const programsResult = await programsRes.json();
      const productsResult = await productsRes.json();
      const productCatalogResult = await productCatalogRes.json();
      const ordersResult = await ordersRes.json();

      if (customersResult.success) {
        setCustomersList(
          customersResult.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            category: c.category || "",
          }))
        );
      }

      if (programsResult.success) {
        setProgramsList(
          programsResult.data.map((p: any) => ({
            id: p.id,
            code: p.code,
            discount: p.discount,
            type: p.type || "percent",
          }))
        );
      }

      // Tạo map thông tin sản phẩm từ catalog (theo mã sản phẩm)
      const catalogMap: Record<string, ProductCatalog & { code: string }> = {};
      if (productCatalogResult.success) {
        productCatalogResult.data.forEach((p: any) => {
          if (p.code) {
            catalogMap[p.code] = {
              name: p.name || "",
              retailPrice: p.retailPrice || 0,
              wholesalePrice: p.wholesalePrice || 0,
              image: p.image || "",
              code: p.code,
            };
          }
        });
      }

      // Lấy Mã SP đầy đủ + hình ảnh + giá từ Danh mục SP
      if (productsResult.success) {
        const productList: Product[] = productsResult.data
          .map((item: { maSPDayDu: string; image: string; wholesalePrice: number; retailPrice: number }, index: number) => {
            const code = item.maSPDayDu || "";

            return {
              id: index + 1,
              code: code,
              name: code, // Dùng Mã SP đầy đủ làm tên
              size: "", // User sẽ chọn size
              color: "", // User sẽ chọn màu
              retailPrice: item.retailPrice || 0,     // Giá lẻ từ Danh mục SP
              wholesalePrice: item.wholesalePrice || 0, // Giá sỉ từ Danh mục SP
              image: item.image || "",                // Hình ảnh từ Danh mục SP
            };
          })
          .filter((p: Product) => p.code.trim() !== "");

        setProductsList(productList);
      }

      // Generate next order code
      if (ordersResult.success) {
        const nextCode = generateNextOrderCode(ordersResult.data);
        setFormOrderCode(nextCode);
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    } finally {
      setIsLoadingDropdownData(false);
    }
  };

  // Determine if customer gets wholesale price
  const isWholesaleCustomer = (category: string): boolean => {
    const wholesaleCategories = ["NPP", "Đại lý", "Shop"];
    return wholesaleCategories.some((cat) =>
      category.toLowerCase().includes(cat.toLowerCase())
    );
  };

  // ============ MULTI-PRODUCT HANDLERS ============

  // Open Add modal - Initialize form
  const handleOpenAddModal = async () => {
    // Reset form first
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPaymentDiscount("");
    setFormNotes("");
    setSelectedProducts([]);
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setFormOrderCode("");

    // Show modal immediately with loading state
    setShowAddModal(true);

    // Then fetch data (modal will show loading spinner)
    await fetchDropdownData();

    // Get next order code
    const response = await fetch("/api/orders");
    const result = await response.json();
    if (result.success) {
      const nextCode = generateNextOrderCode(result.data);
      setFormOrderCode(nextCode);
    }
  };

  // Add product to selected list (multi-product)
  const handleAddProductToList = (product: Product) => {
    // Check if already added
    if (selectedProducts.some((p) => p.productCode === product.code)) {
      toast.error("Sản phẩm đã được thêm vào danh sách");
      return;
    }

    // Get price based on customer type
    const productPrice =
      selectedCustomer && isWholesaleCustomer(selectedCustomer.category)
        ? product.wholesalePrice
        : product.retailPrice;

    const newProduct: SelectedProduct = {
      id: `${product.code}-${Date.now()}`,
      productCode: product.code,
      productName: product.name,
      image: product.image,
      items: 1,
      productPrice,
      subtotal: productPrice,
      salesProgram: "",
      discount: "",
      priceAfterDiscount: productPrice,
      subtotalAfterDiscount: productPrice,
    };

    setSelectedProducts([...selectedProducts, newProduct]);
    setProductSearchTerm("");
    setShowProductDropdown(false);
  };

  // Remove product from selected list
  const handleRemoveProductFromList = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  // Update product quantity in selected list
  const handleUpdateProductInList = (
    id: string,
    field: keyof SelectedProduct,
    value: any
  ) => {
    setSelectedProducts(
      selectedProducts.map((p) => {
        if (p.id !== id) return p;

        const updated = { ...p, [field]: value };

        // Recalculate prices if items, discount, or salesProgram changed
        if (field === "items" || field === "discount" || field === "salesProgram") {
          const items = field === "items" ? value : updated.items;
          let discount = field === "discount" ? value : updated.discount;

          // If salesProgram changed, get discount from program
          if (field === "salesProgram" && value) {
            const program = programsList.find((prog) => prog.code === value);
            discount = program ? program.discount : "";
            updated.discount = discount;
          }

          updated.subtotal = updated.productPrice * items;

          // Calculate price after discount
          if (discount) {
            if (discount.includes("%")) {
              const discountValue = parseFloat(discount.replace("%", "")) / 100;
              updated.priceAfterDiscount = Math.round(
                updated.productPrice * (1 - discountValue)
              );
              updated.subtotalAfterDiscount = Math.round(
                updated.subtotal * (1 - discountValue)
              );
            } else {
              const fixedDiscount =
                parseFloat(discount.replace(/[,.\s]/g, "")) || 0;
              updated.priceAfterDiscount = Math.round(
                updated.productPrice - fixedDiscount
              );
              updated.subtotalAfterDiscount = Math.round(
                updated.priceAfterDiscount * items
              );
            }
          } else {
            updated.priceAfterDiscount = updated.productPrice;
            updated.subtotalAfterDiscount = updated.subtotal;
          }
        }

        return updated;
      })
    );
  };

  // Calculate total for all selected products
  const calculateTotalAllProducts = () => {
    let total = selectedProducts.reduce(
      (sum, p) => sum + p.subtotalAfterDiscount,
      0
    );

    // Apply payment discount
    if (formPaymentDiscount) {
      if (formPaymentDiscount.includes("%")) {
        const discountValue =
          parseFloat(formPaymentDiscount.replace("%", "")) / 100;
        total = total * (1 - discountValue);
      } else {
        const fixedDiscount =
          parseFloat(formPaymentDiscount.replace(/[,.\s]/g, "")) || 0;
        total = total - fixedDiscount;
      }
    }

    return Math.round(total);
  };

  // Handle Add multi-product order
  const handleAddMultiProductOrder = async () => {
    if (!selectedCustomer) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm");
      return;
    }

    try {
      setIsAdding(true);

      // Calculate total with payment discount
      const totalOrder = calculateTotalAllProducts();
      const paymentDiscountPerProduct = Math.round(
        (totalOrder -
          selectedProducts.reduce((sum, p) => sum + p.subtotalAfterDiscount, 0)) /
          selectedProducts.length
      );

      // Create orders sequentially to avoid race condition
      for (const product of selectedProducts) {
        const orderData = {
          code: formOrderCode,
          date: formDate,
          customer: selectedCustomer.name,
          productCode: product.productCode,
          image: product.image,
          items: product.items,
          productPrice: product.productPrice,
          subtotal: product.subtotal,
          salesProgram: product.salesProgram,
          discount: product.discount,
          priceAfterDiscount: product.priceAfterDiscount,
          subtotalAfterDiscount: product.subtotalAfterDiscount,
          paymentDiscount: formPaymentDiscount,
          total: product.subtotalAfterDiscount + paymentDiscountPerProduct,
          salesUser: profile?.full_name || profile?.email || getCachedProfileName(),
          status: "pending",
          notes: formNotes,
        };

        const response = await fetch("/api/orders/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(`Lỗi khi thêm sản phẩm ${product.productCode}`);
        }
      }

      await fetchOrders();
      setShowAddModal(false);
      toast.success(
        `Thêm đơn hàng ${formOrderCode} thành công (${selectedProducts.length} sản phẩm)`
      );
    } catch (error) {
      console.error("Error adding order:", error);
      toast.error("Lỗi khi thêm đơn hàng");
    } finally {
      setIsAdding(false);
    }
  };

  // View grouped order
  const handleViewGrouped = (group: GroupedOrder) => {
    setViewGroupedOrder(group);
    setShowViewModal(true);
  };

  // Download order as JPG
  const handleDownloadJPG = async () => {
    if (!printRef.current || !viewGroupedOrder) return;

    setIsExporting(true);
    setShowPrintDropdown(false);

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `DonHang_${viewGroupedOrder.orderCode}_${new Date().toISOString().split("T")[0]}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (error) {
      console.error("Error exporting to JPG:", error);
      toast.error("Lỗi khi xuất ảnh");
    } finally {
      setIsExporting(false);
    }
  };

  // Print order
  const handlePrint = () => {
    setShowPrintDropdown(false);

    const printContent = printRef.current;
    if (!printContent || !viewGroupedOrder) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Đơn hàng - ${viewGroupedOrder.orderCode}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Edit grouped order
  const handleEditGrouped = (group: GroupedOrder) => {
    setEditGroupedOrder({ ...group });
    setEditProducts(group.products.map((p) => ({ ...p })));
    fetchDropdownData();
    setShowEditModal(true);
  };

  // Delete grouped order (all products with same order code)
  const handleDeleteGrouped = (orderCode: string) => {
    setOrderToDelete(orderCode);
    setShowDeleteModal(true);
  };

  // Confirm delete grouped order
  const confirmDeleteGrouped = async () => {
    if (!orderToDelete) return;

    try {
      setIsDeleting(true);

      // Find all orders with this code
      const ordersToDelete = orders.filter((o) => o.code === orderToDelete);

      // Delete all sequentially
      for (const order of ordersToDelete) {
        const response = await fetch(`/api/orders/delete?id=${order.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (!result.success) {
          toast.error(`Lỗi khi xóa đơn hàng ${order.id}`);
        }
      }

      await fetchOrders();
      setShowDeleteModal(false);
      setOrderToDelete(null);
      toast.success(
        `Xóa đơn hàng ${orderToDelete} thành công (${ordersToDelete.length} sản phẩm)`
      );
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Lỗi khi xóa đơn hàng");
    } finally {
      setIsDeleting(false);
    }
  };

  // ============ END MULTI-PRODUCT HANDLERS ============

  const resetAddForm = () => {
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setProductSearchTerm("");
    setFormOrderCode("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPaymentDiscount("");
    setFormNotes("");
    setSelectedProducts([]);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            Danh sách đơn hàng ({filteredGroupedOrders.length})
          </h3>
          <div className="flex-1 max-w-md relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={isLoadingDropdownData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoadingDropdownData ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Đang mở...
            </>
          ) : (
            <>
              <Plus size={20} />
              Tạo đơn hàng
            </>
          )}
        </button>
      </div>

      {/* Table - Grouped by Order Code */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : filteredGroupedOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="font-medium">Chưa có đơn hàng nào</p>
          <p className="text-sm mt-1">
            Nhấn &quot;Tạo đơn hàng&quot; để bắt đầu
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">Mã ĐH</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">Ngày đặt</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">Khách hàng</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-500">Số SP</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-500">Tổng SL</th>
                <th className="px-3 py-3 text-right text-sm font-medium text-gray-500">Tổng tiền</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">User BH</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">Ghi chú</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGroupedOrders.map((group) => (
                <tr key={group.orderCode} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm font-medium text-blue-600">{group.orderCode}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{group.date}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">{group.customer}</td>
                  <td className="px-3 py-3 text-sm text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {group.productCount}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-center font-medium text-gray-900">
                    {group.totalItems > 0 ? group.totalItems.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-3 text-sm text-right font-semibold text-green-600">
                    {group.total > 0 ? group.total.toLocaleString("vi-VN") + "đ" : "-"}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">{group.salesUser || "-"}</td>
                  <td className="px-3 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                    {group.notes || "-"}
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
                        onClick={() => handleDeleteGrouped(group.orderCode)}
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
      )}

      {/* Modal xem chi tiết đơn hàng - Grouped */}
      {showViewModal && viewGroupedOrder && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowViewModal(false); setViewGroupedOrder(null); }} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết đơn hàng</h3>
                <p className="text-sm text-gray-500">Mã ĐH: {viewGroupedOrder.orderCode}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Print Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowPrintDropdown(!showPrintDropdown)}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang xuất...
                      </>
                    ) : (
                      <>
                        <Printer size={18} />
                        In / Tải xuống
                        <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                  {showPrintDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowPrintDropdown(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <button
                          onClick={handleDownloadJPG}
                          className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
                        >
                          <Download size={18} className="text-green-600" />
                          <span>Tải xuống JPG</span>
                        </button>
                        <button
                          onClick={handlePrint}
                          className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-b-lg border-t border-gray-100"
                        >
                          <Printer size={18} className="text-blue-600" />
                          <span>In qua máy in</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => { setShowViewModal(false); setViewGroupedOrder(null); setShowPrintDropdown(false); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Order Info */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Mã đơn hàng:</span>
                  <p className="font-medium text-blue-600">{viewGroupedOrder.orderCode}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ngày đặt:</span>
                  <p className="font-medium">{viewGroupedOrder.date}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Khách hàng:</span>
                  <p className="font-medium">{viewGroupedOrder.customer}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">User bán hàng:</span>
                  <p className="font-medium">{viewGroupedOrder.salesUser || "-"}</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-yellow-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách sản phẩm ({viewGroupedOrder.productCount})
                    <span className="ml-2 text-blue-600">- Tổng: {viewGroupedOrder.totalItems.toLocaleString("vi-VN")} sản phẩm</span>
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">SL</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Giá SP</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tiền hàng</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">CT BH</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">CK</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Giá sau CK</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-yellow-100">Tiền sau CK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewGroupedOrder.products.map((product, index) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-3 py-2 text-sm font-medium text-blue-600">{product.productCode}</td>
                          <td className="px-3 py-2 text-sm text-center">{product.items}</td>
                          <td className="px-3 py-2 text-sm text-right">{product.productPrice.toLocaleString("vi-VN")}</td>
                          <td className="px-3 py-2 text-sm text-right">{product.subtotal.toLocaleString("vi-VN")}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{product.salesProgram || "-"}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{product.discount || "-"}</td>
                          <td className="px-3 py-2 text-sm text-right">{product.priceAfterDiscount.toLocaleString("vi-VN")}</td>
                          <td className="px-3 py-2 text-sm text-right font-medium bg-yellow-50">{product.subtotalAfterDiscount.toLocaleString("vi-VN")}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-sm font-medium text-right">Tổng tiền hàng sau CK:</td>
                        <td colSpan={4} className="px-3 py-2 text-sm text-right"></td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-blue-600">
                          {viewGroupedOrder.products.reduce((sum, p) => sum + p.subtotalAfterDiscount, 0).toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-sm font-medium text-right">CK thanh toán:</td>
                        <td colSpan={4} className="px-3 py-2 text-sm text-right"></td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-orange-600">
                          {viewGroupedOrder.paymentDiscount || "-"}
                        </td>
                      </tr>
                      <tr className="bg-green-50">
                        <td colSpan={4} className="px-3 py-2 text-sm font-bold text-right">Khách phải trả:</td>
                        <td colSpan={4} className="px-3 py-2 text-sm text-right"></td>
                        <td className="px-3 py-2 text-sm text-right font-bold text-green-600 text-lg">
                          {viewGroupedOrder.total.toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Note */}
              {viewGroupedOrder.notes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Ghi chú:</span>
                  <p className="font-medium">{viewGroupedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Printable content - Hidden but used for export */}
            <div className="absolute left-[-9999px] top-0">
              <div
                ref={printRef}
                style={{
                  width: "210mm",
                  minHeight: "148mm",
                  padding: "10mm",
                  backgroundColor: "#fff",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "15px", borderBottom: "2px solid #2563eb", paddingBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #ef4444 50%, #000 50%)",
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "18px" }}>RIOMIO</div>
                      <div style={{ fontSize: "10px", color: "#666" }}>Thời trang trẻ em</div>
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", fontSize: "16px", color: "#2563eb" }}>ĐƠN HÀNG</div>
                    <div style={{ fontSize: "14px", fontWeight: "bold" }}>{viewGroupedOrder.orderCode}</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Ngày: {viewGroupedOrder.date}</div>
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px", padding: "10px", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#666" }}>Khách hàng:</span>
                    <p style={{ fontWeight: "600", fontSize: "13px" }}>{viewGroupedOrder.customer}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#666" }}>Nhân viên bán hàng:</span>
                    <p style={{ fontWeight: "600", fontSize: "13px" }}>{viewGroupedOrder.salesUser || "-"}</p>
                  </div>
                </div>

                {/* Products Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f3f4f6" }}>
                      <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", width: "30px" }}>STT</th>
                      <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "left" }}>Mã SP</th>
                      <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", width: "40px" }}>SL</th>
                      <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "right" }}>Đơn giá</th>
                      <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "right" }}>Thành tiền</th>
                      <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center" }}>CK</th>
                      <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "right", backgroundColor: "#fef3c7" }}>Sau CK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewGroupedOrder.products.map((product, index) => (
                      <tr key={product.id}>
                        <td style={{ border: "1px solid #d1d5db", padding: "5px", textAlign: "center" }}>{index + 1}</td>
                        <td style={{ border: "1px solid #d1d5db", padding: "5px", fontWeight: "500", color: "#2563eb" }}>{product.productCode}</td>
                        <td style={{ border: "1px solid #d1d5db", padding: "5px", textAlign: "center" }}>{product.items}</td>
                        <td style={{ border: "1px solid #d1d5db", padding: "5px", textAlign: "right" }}>{product.productPrice.toLocaleString("vi-VN")}</td>
                        <td style={{ border: "1px solid #d1d5db", padding: "5px", textAlign: "right" }}>{product.subtotal.toLocaleString("vi-VN")}</td>
                        <td style={{ border: "1px solid #d1d5db", padding: "5px", textAlign: "center" }}>{product.discount || "-"}</td>
                        <td style={{ border: "1px solid #d1d5db", padding: "5px", textAlign: "right", backgroundColor: "#fffbeb", fontWeight: "500" }}>{product.subtotalAfterDiscount.toLocaleString("vi-VN")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#f3f4f6" }}>
                      <td colSpan={6} style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "right", fontWeight: "600" }}>Tổng tiền hàng sau CK:</td>
                      <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "right", fontWeight: "600", color: "#2563eb" }}>
                        {viewGroupedOrder.products.reduce((sum, p) => sum + p.subtotalAfterDiscount, 0).toLocaleString("vi-VN")}đ
                      </td>
                    </tr>
                    {viewGroupedOrder.paymentDiscount && (
                      <tr>
                        <td colSpan={6} style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "right", fontWeight: "500" }}>CK thanh toán:</td>
                        <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "right", color: "#ea580c" }}>{viewGroupedOrder.paymentDiscount}</td>
                      </tr>
                    )}
                    <tr style={{ backgroundColor: "#dcfce7" }}>
                      <td colSpan={6} style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontWeight: "bold", fontSize: "13px" }}>KHÁCH PHẢI TRẢ:</td>
                      <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontWeight: "bold", fontSize: "14px", color: "#16a34a" }}>
                        {viewGroupedOrder.total.toLocaleString("vi-VN")}đ
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Notes */}
                {viewGroupedOrder.notes && (
                  <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#f9fafb", borderRadius: "4px", fontSize: "11px" }}>
                    <span style={{ color: "#666" }}>Ghi chú: </span>
                    <span>{viewGroupedOrder.notes}</span>
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666" }}>
                  <div>In ngày: {new Date().toLocaleDateString("vi-VN")}</div>
                  <div>RIOMIO - Thời trang trẻ em</div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa đơn hàng */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                Xác nhận xóa đơn hàng
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
                }}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-700 mb-2">
              Bạn có chắc chắn muốn xóa đơn hàng{" "}
              <span className="font-semibold text-blue-600">
                {orderToDelete}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteGrouped}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm đơn hàng - Multi-product */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowAddModal(false); resetAddForm(); setSelectedProducts([]); }} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {isAdding && (
              <div className="fixed inset-4 lg:inset-8 bg-white/80 z-70 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-700 font-medium">Đang tạo đơn hàng...</p>
                <p className="text-gray-500 text-sm mt-1">Vui lòng đợi trong giây lát</p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Tạo đơn hàng mới</h3>
                <p className="text-sm text-gray-500">Mã ĐH: {formOrderCode}</p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetAddForm(); setSelectedProducts([]); }}
                disabled={isAdding}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDropdownData ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
                </div>
              ) : (
                <>
                  {/* Order Info */}
                  <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                      <input
                        type="text"
                        value={formOrderCode}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đặt</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="relative" ref={customerDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Khách hàng <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customerSearchTerm}
                          onChange={(e) => {
                            setCustomerSearchTerm(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          placeholder="Tìm khách hàng..."
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      </div>
                      {showCustomerDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredCustomers.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy</div>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setCustomerSearchTerm(customer.name);
                                  setShowCustomerDropdown(false);
                                  // Update prices for already selected products
                                  setSelectedProducts(prev => prev.map(p => {
                                    const prod = productsList.find(pl => pl.code === p.productCode);
                                    if (!prod) return p;
                                    const newPrice = isWholesaleCustomer(customer.category) ? prod.wholesalePrice : prod.retailPrice;
                                    return {
                                      ...p,
                                      productPrice: newPrice,
                                      subtotal: newPrice * p.items,
                                      priceAfterDiscount: newPrice,
                                      subtotalAfterDiscount: newPrice * p.items,
                                    };
                                  }));
                                }}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm"
                              >
                                <span>{customer.name}</span>
                                {customer.category && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{customer.category}</span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User bán hàng</label>
                      <input
                        type="text"
                        value={profile?.full_name || profile?.email || getCachedProfileName() || "Đang tải..."}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                      />
                    </div>
                  </div>

                  {/* Add Product Section + Payment & Notes in same row */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Add Product */}
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="relative" ref={productDropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thêm sản phẩm</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={productSearchTerm}
                            onChange={(e) => {
                              setProductSearchTerm(e.target.value);
                              setShowProductDropdown(true);
                            }}
                            onFocus={() => setShowProductDropdown(true)}
                            placeholder="Tìm theo mã SP hoặc tên..."
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                        {showProductDropdown && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredProducts.length === 0 ? (
                              <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy sản phẩm</div>
                            ) : (
                              filteredProducts.map((product) => (
                                <div
                                  key={product.id}
                                  onClick={() => handleAddProductToList(product)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                                >
                                  <div className="font-medium text-sm">
                                    {product.code && <span className="text-blue-600">{product.code}</span>}
                                    {product.code && product.name && " - "}
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Sỉ: {product.wholesalePrice.toLocaleString("vi-VN")}đ | Lẻ: {product.retailPrice.toLocaleString("vi-VN")}đ
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CK thanh toán</label>
                          <input
                            type="text"
                            value={formPaymentDiscount}
                            onChange={(e) => setFormPaymentDiscount(e.target.value)}
                            placeholder="VD: 5% hoặc 20000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Khách phải trả</label>
                          <input
                            type="text"
                            value={calculateTotalAllProducts().toLocaleString("vi-VN") + "đ"}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-bold text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Products Table - At Bottom */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="font-medium text-gray-800">
                        Danh sách sản phẩm ({selectedProducts.length})
                      </h4>
                    </div>
                    {selectedProducts.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Chưa có sản phẩm nào. Tìm và thêm sản phẩm ở trên.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-14">Ảnh</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">SL</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Giá SP</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tiền hàng</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-32">CT BH</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">CK</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Giá sau CK</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-yellow-100">Tiền sau CK</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedProducts.map((product, index) => (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                                <td className="px-3 py-2 text-center">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.productCode}
                                      className="w-10 h-10 object-cover rounded mx-auto"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <span className={product.image ? 'hidden' : 'text-gray-400 text-xs'}>-</span>
                                </td>
                                <td className="px-3 py-2 text-sm font-medium text-blue-600">{product.productCode}</td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={product.items || ""}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                                      handleUpdateProductInList(product.id, "items", parseInt(value) || 0);
                                    }}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-right">{product.productPrice.toLocaleString("vi-VN")}</td>
                                <td className="px-3 py-2 text-sm text-right">{product.subtotal.toLocaleString("vi-VN")}</td>
                                <td className="px-3 py-2">
                                  <select
                                    value={product.salesProgram}
                                    onChange={(e) => handleUpdateProductInList(product.id, "salesProgram", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="">--</option>
                                    {programsList.map((program) => (
                                      <option key={program.id} value={program.code}>{program.code}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={product.discount}
                                    onChange={(e) => handleUpdateProductInList(product.id, "discount", e.target.value)}
                                    placeholder="10%"
                                    readOnly={!!product.salesProgram}
                                    className={`w-20 px-2 py-1 border rounded text-sm ${
                                      product.salesProgram ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "border-gray-300"
                                    }`}
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-right">{product.priceAfterDiscount.toLocaleString("vi-VN")}</td>
                                <td className="px-3 py-2 text-sm text-right font-medium bg-yellow-50">{product.subtotalAfterDiscount.toLocaleString("vi-VN")}</td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => handleRemoveProductFromList(product.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-100">
                            <tr>
                              <td colSpan={5} className="px-3 py-2 text-sm font-medium text-right">Tổng tiền hàng sau CK:</td>
                              <td colSpan={4} className="px-3 py-2"></td>
                              <td className="px-3 py-2 text-sm text-right font-semibold text-blue-600">
                                {selectedProducts.reduce((sum, p) => sum + p.subtotalAfterDiscount, 0).toLocaleString("vi-VN")}đ
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!isLoadingDropdownData && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => { setShowAddModal(false); resetAddForm(); setSelectedProducts([]); }}
                  disabled={isAdding}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddMultiProductOrder}
                  disabled={isAdding || !selectedCustomer || selectedProducts.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Tạo đơn hàng ({selectedProducts.length} SP)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </Portal>
      )}

      {/* Modal sửa đơn hàng - Grouped */}
      {showEditModal && editGroupedOrder && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowEditModal(false)} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa đơn hàng</h3>
                <p className="text-sm text-gray-500">Mã ĐH: {editGroupedOrder.orderCode}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Order Info */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                  <input
                    type="text"
                    value={editGroupedOrder.orderCode}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đặt</label>
                  <input
                    type="date"
                    value={editGroupedOrder.date}
                    onChange={(e) => setEditGroupedOrder({ ...editGroupedOrder, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                  <input
                    type="text"
                    value={editGroupedOrder.customer}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User bán hàng</label>
                  <input
                    type="text"
                    value={editGroupedOrder.salesUser}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách sản phẩm ({editProducts.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">SL</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Giá SP</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tiền hàng</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-32">CT BH</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">CK</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Giá sau CK</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-yellow-100">Tiền sau CK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {editProducts.map((product, index) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-3 py-2 text-sm font-medium text-blue-600">{product.productCode}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={product.items || ""}
                              onChange={(e) => {
                                const value = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                                const items = parseInt(value) || 0;
                                setEditProducts(prev => prev.map(p => {
                                  if (p.id !== product.id) return p;
                                  const subtotal = p.productPrice * items;
                                  const subtotalAfterDiscount = p.priceAfterDiscount * items;
                                  return { ...p, items, subtotal, subtotalAfterDiscount };
                                }));
                              }}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-right">{product.productPrice.toLocaleString("vi-VN")}</td>
                          <td className="px-3 py-2 text-sm text-right">{product.subtotal.toLocaleString("vi-VN")}</td>
                          <td className="px-3 py-2">
                            <select
                              value={product.salesProgram}
                              onChange={(e) => {
                                const programCode = e.target.value;
                                const program = programsList.find(p => p.code === programCode);
                                const discount = program ? program.discount : "";
                                setEditProducts(prev => prev.map(p => {
                                  if (p.id !== product.id) return p;
                                  let priceAfterDiscount = p.productPrice;
                                  if (discount) {
                                    if (discount.includes("%")) {
                                      const discountValue = parseFloat(discount.replace("%", "")) / 100;
                                      priceAfterDiscount = Math.round(p.productPrice * (1 - discountValue));
                                    } else {
                                      const fixedDiscount = parseFloat(discount.replace(/[,.\s]/g, "")) || 0;
                                      priceAfterDiscount = Math.round(p.productPrice - fixedDiscount);
                                    }
                                  }
                                  return {
                                    ...p,
                                    salesProgram: programCode,
                                    discount,
                                    priceAfterDiscount,
                                    subtotalAfterDiscount: priceAfterDiscount * p.items
                                  };
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">--</option>
                              {programsList.map((program) => (
                                <option key={program.id} value={program.code}>{program.code}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={product.discount}
                              onChange={(e) => {
                                const discount = e.target.value;
                                setEditProducts(prev => prev.map(p => {
                                  if (p.id !== product.id) return p;
                                  let priceAfterDiscount = p.productPrice;
                                  if (discount) {
                                    if (discount.includes("%")) {
                                      const discountValue = parseFloat(discount.replace("%", "")) / 100;
                                      priceAfterDiscount = Math.round(p.productPrice * (1 - discountValue));
                                    } else {
                                      const fixedDiscount = parseFloat(discount.replace(/[,.\s]/g, "")) || 0;
                                      priceAfterDiscount = Math.round(p.productPrice - fixedDiscount);
                                    }
                                  }
                                  return {
                                    ...p,
                                    discount,
                                    priceAfterDiscount,
                                    subtotalAfterDiscount: priceAfterDiscount * p.items
                                  };
                                }));
                              }}
                              placeholder="10%"
                              readOnly={!!product.salesProgram}
                              className={`w-20 px-2 py-1 border rounded text-sm ${
                                product.salesProgram ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "border-gray-300"
                              }`}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-right">{product.priceAfterDiscount.toLocaleString("vi-VN")}</td>
                          <td className="px-3 py-2 text-sm text-right font-medium bg-yellow-50">{product.subtotalAfterDiscount.toLocaleString("vi-VN")}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-sm font-medium text-right">Tổng tiền hàng sau CK:</td>
                        <td colSpan={4} className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-blue-600">
                          {editProducts.reduce((sum, p) => sum + p.subtotalAfterDiscount, 0).toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment & Notes */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CK thanh toán</label>
                  <input
                    type="text"
                    value={editGroupedOrder.paymentDiscount}
                    onChange={(e) => setEditGroupedOrder({ ...editGroupedOrder, paymentDiscount: e.target.value })}
                    placeholder="VD: 5% hoặc 20000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khách phải trả</label>
                  <input
                    type="text"
                    value={(() => {
                      let total = editProducts.reduce((sum, p) => sum + p.subtotalAfterDiscount, 0);
                      if (editGroupedOrder.paymentDiscount) {
                        if (editGroupedOrder.paymentDiscount.includes("%")) {
                          const discountValue = parseFloat(editGroupedOrder.paymentDiscount.replace("%", "")) / 100;
                          total = total * (1 - discountValue);
                        } else {
                          const fixedDiscount = parseFloat(editGroupedOrder.paymentDiscount.replace(/[,.\s]/g, "")) || 0;
                          total = total - fixedDiscount;
                        }
                      }
                      return Math.round(total).toLocaleString("vi-VN") + "đ";
                    })()}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <input
                    type="text"
                    value={editGroupedOrder.notes}
                    onChange={(e) => setEditGroupedOrder({ ...editGroupedOrder, notes: e.target.value })}
                    placeholder="Ghi chú..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsUpdating(true);
                    // Update all products sequentially
                    for (const product of editProducts) {
                      const updateData = {
                        ...product,
                        date: editGroupedOrder.date,
                        paymentDiscount: editGroupedOrder.paymentDiscount,
                        notes: editGroupedOrder.notes,
                      };
                      const response = await fetch("/api/orders/update", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updateData),
                      });
                      const result = await response.json();
                      if (!result.success) {
                        toast.error(`Lỗi khi cập nhật sản phẩm ${product.productCode}`);
                      }
                    }
                    await fetchOrders();
                    setShowEditModal(false);
                    setEditGroupedOrder(null);
                    toast.success(`Cập nhật đơn hàng ${editGroupedOrder.orderCode} thành công`);
                  } catch (error) {
                    console.error("Error updating order:", error);
                    toast.error("Lỗi khi cập nhật đơn hàng");
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                disabled={isUpdating || editProducts.length === 0}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Edit size={18} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
