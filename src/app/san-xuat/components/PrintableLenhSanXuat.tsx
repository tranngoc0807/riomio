"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Printer, Download, ChevronDown } from "lucide-react";
import type { KeHoachSX } from "@/lib/googleSheets";

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

interface PrintableLenhSanXuatProps {
  data: GroupedLSX;
}

const ALL_SIZES = [
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
  { key: "sizeXS", label: "XS" },
  { key: "sizeS", label: "S" },
  { key: "sizeM", label: "M" },
  { key: "sizeL", label: "L" },
  { key: "sizeXL", label: "XL" },
];

// Get sizes that have data across all products
const getSizesWithData = (products: KeHoachSX[]) => {
  return ALL_SIZES.filter((s) =>
    products.some((p) => (p as any)[s.key] > 0)
  );
};

const formatDate = (dateString: string | number) => {
  if (!dateString) return "-";

  const strValue = String(dateString);

  // Handle dd/mm/yyyy format
  if (strValue.includes("/")) {
    return strValue;
  }

  // Handle yyyy-mm-dd format
  if (strValue.includes("-")) {
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }

  // Handle Excel serial number
  const numValue = Number(strValue);
  if (!isNaN(numValue) && numValue > 25000 && numValue < 100000) {
    const date = new Date((numValue - 25569) * 86400 * 1000);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return strValue;
};

export default function PrintableLenhSanXuat({ data }: PrintableLenhSanXuatProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Get only sizes that have data for this LSX
  const sizesWithData = getSizesWithData(data.products);

  const handleDownloadJPG = async () => {
    if (!printRef.current) return;

    setIsExporting(true);
    setShowDropdown(false);

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `LSX_${data.lsxCode}_${new Date().toISOString().split("T")[0]}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (error) {
      console.error("Error exporting to JPG:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setShowDropdown(false);

    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lệnh sản xuất - ${data.lsxCode}</title>
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

  return (
    <div className="relative">
      {/* Action buttons */}
      <div className="relative inline-block">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <span className="animate-spin">⏳</span>
              Đang xuất...
            </>
          ) : (
            <>
              <Printer size={18} />
              In lệnh sản xuất
              <ChevronDown size={16} />
            </>
          )}
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
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

      {/* Printable content - Hidden but used for export */}
      <div className="absolute left-[-9999px] top-0">
        <div
          ref={printRef}
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "15mm",
            backgroundColor: "#fff",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ef4444 50%, #000 50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                R
              </div>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "14px", color: "#ef4444" }}>RIOMIO OFFICIAL</div>
                <div style={{ fontSize: "10px", color: "#666" }}>
                  ADD: B12 TT7 Nguyễn Sơn Hà, KĐT Văn Quán, Phúc La, Hà Đông, Hà Nội
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              textAlign: "center",
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1e3a8a",
              margin: "15px 0",
              letterSpacing: "2px",
            }}
          >
            LỆNH SẢN XUẤT
          </h1>

          {/* Order info */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "13px" }}>
            <div>
              <div style={{ marginBottom: "5px" }}>
                <strong>Mã:</strong> <span style={{ color: "#2563eb", fontWeight: "bold" }}>{data.lsxCode}</span>
              </div>
              <div>
                <strong>Xưởng:</strong> {data.workshop || "-"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: "5px" }}>
                <strong>Ngày ra lệnh:</strong> {formatDate(data.orderDate)}
              </div>
              <div style={{ marginBottom: "5px" }}>
                <strong>Ngày hoàn thành:</strong> {formatDate(data.completionDate)}
              </div>
              <div>
                <strong>Tổng SL các mã:</strong> <span style={{ color: "#dc2626", fontWeight: "bold" }}>{data.totalQuantity}</span>
              </div>
            </div>
          </div>

          {/* Products table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
              marginBottom: "20px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={{ border: "1px solid #d1d5db", padding: "8px 4px", textAlign: "center", width: "35px" }}>
                  STT
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "8px 4px", textAlign: "center", width: "60px" }}>
                  Mã SP
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "8px 4px", textAlign: "left" }}>
                  Tên SP
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "8px 4px", textAlign: "center", width: "60px" }}>
                  Dòng size
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "8px 4px", textAlign: "center", width: "70px" }}>
                  Mã vải chính
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "8px 4px", textAlign: "center", width: "60px" }}>
                  Màu sắc
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "8px 4px", textAlign: "center", width: "50px" }}>
                  Hình ảnh
                </th>
                {sizesWithData.map((s) => (
                  <th
                    key={s.key}
                    style={{
                      border: "1px solid #d1d5db",
                      padding: "8px 2px",
                      textAlign: "center",
                      width: "30px",
                      backgroundColor: "#fef3c7",
                    }}
                  >
                    {s.label}
                  </th>
                ))}
                <th
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "8px 4px",
                    textAlign: "center",
                    width: "50px",
                    backgroundColor: "#fef9c3",
                    fontWeight: "bold",
                  }}
                >
                  Tổng số lượng
                </th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product, index) => (
                <tr key={product.id}>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px 4px", textAlign: "center" }}>
                    {index + 1}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px 4px", textAlign: "center", fontWeight: "500" }}>
                    {product.productCode}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px 4px" }}>
                    {product.productName}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px 4px", textAlign: "center" }}>
                    {product.size || "0/1-7/8"}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px 4px", textAlign: "center" }}>
                    {product.mainFabric || "-"}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px 4px", textAlign: "center" }}>
                    {product.color || "-"}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "4px", textAlign: "center" }}>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.productName}
                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  {sizesWithData.map((s) => (
                    <td
                      key={s.key}
                      style={{
                        border: "1px solid #d1d5db",
                        padding: "6px 2px",
                        textAlign: "center",
                        backgroundColor: "#fffbeb",
                      }}
                    >
                      {(product as any)[s.key] || "-"}
                    </td>
                  ))}
                  <td
                    style={{
                      border: "1px solid #d1d5db",
                      padding: "6px 4px",
                      textAlign: "center",
                      fontWeight: "bold",
                      backgroundColor: "#fef9c3",
                      color: "#dc2626",
                    }}
                  >
                    {product.totalQuantity || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "40px",
              paddingTop: "20px",
            }}
          >
            {["Người lập lệnh", "Kế toán", "Phòng sản xuất", "Giám đốc"].map((title) => (
              <div key={title} style={{ textAlign: "center", width: "22%" }}>
                <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "5px" }}>{title}</div>
                <div style={{ fontSize: "10px", color: "#666", fontStyle: "italic" }}>(Ký, ghi rõ họ tên)</div>
                <div style={{ height: "60px" }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
