"use client";

import { useState, type RefObject } from "react";
import { Printer, Download, ChevronDown, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

interface PrintDownloadButtonProps {
  targetRef: RefObject<HTMLElement | null>;
  fileName: string;
  title: string;
  buttonLabel?: string;
  className?: string;
}

export default function PrintDownloadButton({
  targetRef,
  fileName,
  title,
  buttonLabel = "In / Tải xuống",
  className = "",
}: PrintDownloadButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadJPG = async () => {
    if (!targetRef.current) {
      toast.error("Không tìm thấy nội dung để xuất");
      return;
    }

    setIsExporting(true);
    setShowDropdown(false);

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `${fileName}_${dateStr}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (error) {
      console.error("Error exporting to JPG:", error);
      toast.error("Lỗi khi xuất ảnh");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setShowDropdown(false);

    const printContent = targetRef.current;
    if (!printContent) {
      toast.error("Không tìm thấy nội dung để in");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Clone node và reset position styles (template có thể đặt offscreen
    // bằng position:absolute; left:-10000px — nếu không reset, print window
    // cũng sẽ render trắng)
    const cloned = printContent.cloneNode(true) as HTMLElement;
    cloned.style.position = "static";
    cloned.style.left = "auto";
    cloned.style.top = "auto";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print { body { padding: 0; } }
            img { max-width: 100%; }
          </style>
        </head>
        <body>${cloned.outerHTML}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
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
            {buttonLabel}
            <ChevronDown size={16} />
          </>
        )}
      </button>
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
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
  );
}
