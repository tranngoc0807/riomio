"use client";

import { useCallback, useEffect, useState } from "react";
import { History, X, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import Portal from "@/components/Portal";

interface Props {
  tableKey: string;
  /** Nếu có thì xem lịch sử của 1 row. Nếu không thì xem toàn bộ bảng. */
  rowIndex?: number;
  /** Title hiển thị trong subtitle modal (vd: tên row hoặc tên bảng). */
  title?: string;
  /** Style nút: "icon" (chỉ icon, dùng trong cột thao tác) hoặc "labeled" (icon + chữ, đặt ở header). */
  variant?: "icon" | "labeled";
  /** Label cho variant labeled. Mặc định "Lịch sử chỉnh sửa". */
  label?: string;
}

interface EditHistoryRow {
  id: string;
  created_at: string;
  user_email: string | null;
  source: "app" | "sheets_ui";
  action: "add" | "update" | "delete";
  table_key: string;
  sheet_name: string | null;
  row_index: number | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
}

export default function EditHistoryButton({
  tableKey,
  rowIndex,
  title,
  variant = "icon",
  label = "Lịch sử chỉnh sửa",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<EditHistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ tableKey });
      if (rowIndex !== undefined) qs.set("rowIndex", String(rowIndex));
      qs.set("limit", rowIndex !== undefined ? "100" : "500");
      const res = await fetch(`/api/edit-history?${qs.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRows(json.data || []);
      } else {
        setError(json.error || "Không tải được lịch sử");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, [tableKey, rowIndex]);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, fetchHistory]);

  const isPageMode = rowIndex === undefined;

  return (
    <>
      {variant === "labeled" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title={label}
        >
          <History size={16} />
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Xem lịch sử chỉnh sửa"
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <History size={16} />
        </button>
      )}

      {open && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lịch sử chỉnh sửa
                  </h3>
                  <p className="text-sm text-gray-500">
                    {title ? `${title} · ` : ""}
                    {tableKey}
                    {isPageMode ? "" : ` · row ${rowIndex}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchHistory}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Tải lại"
                  >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loading && rows.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    Đang tải lịch sử…
                  </div>
                ) : error ? (
                  <div className="text-center text-red-600 py-10">{error}</div>
                ) : rows.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    {isPageMode
                      ? "Chưa có lịch sử chỉnh sửa cho bảng này."
                      : "Chưa có lịch sử chỉnh sửa cho dòng này."}
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {rows.map((row) => (
                      <HistoryItem
                        key={row.id}
                        row={row}
                        showRowIndex={isPageMode}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

function HistoryItem({
  row,
  showRowIndex,
}: {
  row: EditHistoryRow;
  showRowIndex: boolean;
}) {
  const fmtDate = formatDate(row.created_at);
  const ActionIcon =
    row.action === "add" ? Plus : row.action === "delete" ? Trash2 : Pencil;
  const actionColor =
    row.action === "add"
      ? "bg-green-100 text-green-700"
      : row.action === "delete"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";
  const actionLabel =
    row.action === "add" ? "Thêm" : row.action === "delete" ? "Xóa" : "Cập nhật";

  return (
    <li className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className={`p-2 rounded-full ${actionColor}`}>
          <ActionIcon size={16} />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColor}`}>
              {actionLabel}
            </span>
            {showRowIndex && row.row_index !== null && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                Row {row.row_index}
              </span>
            )}
            <span className="text-gray-500">
              {row.source === "sheets_ui" ? "Google Sheets UI" : "App"}
            </span>
            <span className="text-gray-400">·</span>
            <span className="font-medium text-gray-800">
              {row.user_email || "Không xác định"}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">{fmtDate}</span>
          </div>

          <div className="mt-3">
            {row.action === "update" ? (
              <UpdateDiff row={row} />
            ) : row.action === "add" ? (
              <DataBlock label="Giá trị mới" data={row.new_data} variant="add" />
            ) : (
              <DataBlock label="Giá trị đã xóa" data={row.old_data} variant="delete" />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function UpdateDiff({ row }: { row: EditHistoryRow }) {
  const fields = row.changed_fields ?? [];
  if (fields.length === 0) {
    return <p className="text-sm text-gray-500">Không có thay đổi.</p>;
  }
  return (
    <div className="space-y-1.5">
      {fields.map((f) => (
        <div key={f} className="text-sm grid grid-cols-[8rem_1fr_1fr] gap-2 items-start">
          <span className="font-medium text-gray-700 truncate" title={f}>
            {f}
          </span>
          <span className="bg-red-50 text-red-800 px-2 py-1 rounded line-through break-words">
            {formatValue(row.old_data?.[f])}
          </span>
          <span className="bg-green-50 text-green-800 px-2 py-1 rounded break-words">
            {formatValue(row.new_data?.[f])}
          </span>
        </div>
      ))}
    </div>
  );
}

function DataBlock({
  label,
  data,
  variant,
}: {
  label: string;
  data: Record<string, unknown> | null;
  variant: "add" | "delete";
}) {
  if (!data) return null;
  const entries = Object.entries(data).filter(
    ([, v]) => v !== "" && v !== null && v !== undefined
  );
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">(trống)</p>;
  }
  const bg = variant === "add" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800";
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">{label}</p>
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="text-sm grid grid-cols-[8rem_1fr] gap-2 items-start">
            <span className="font-medium text-gray-700 truncate" title={k}>
              {k}
            </span>
            <span className={`${bg} px-2 py-1 rounded break-words`}>
              {formatValue(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "(trống)";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
