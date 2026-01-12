"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Check,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

type AttendanceStatus = "present" | "late" | "absent" | "off" | "future";

interface AttendanceRecord {
  stt: number;
  hoTen: string;
  chucVu: string;
  attendance: AttendanceStatus[];
}

export default function AttendanceTab() {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  // Load attendance data when month/year changes
  useEffect(() => {
    loadAttendanceFromSheet();
  }, [selectedYear, selectedMonth]);

  const sheetToPageStatus = (sheetStatus: string, dayIndex: number): AttendanceStatus => {
    const day = dayIndex + 1;
    const date = new Date(selectedYear, selectedMonth - 1, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isFutureDay =
      selectedYear > currentYear ||
      (selectedYear === currentYear && selectedMonth > currentMonth) ||
      (selectedYear === currentYear && selectedMonth === currentMonth && day > currentDay);

    if (isFutureDay) return "future";

    switch (sheetStatus) {
      case "P":
        return "present";
      case "L":
        return "late";
      case "A":
        return "absent";
      case "O":
        return "off";
      default:
        return isWeekend ? "off" : "absent";
    }
  };

  const pageToSheetStatus = (pageStatus: AttendanceStatus): string => {
    switch (pageStatus) {
      case "present":
        return "P";
      case "late":
        return "L";
      case "absent":
        return "A";
      case "off":
        return "O";
      case "future":
        return "";
      default:
        return "";
    }
  };

  const loadAttendanceFromSheet = async () => {
    setIsLoadingAttendance(true);
    setHasUnsavedChanges(false);
    try {
      const response = await fetch(
        `/api/cham-cong?thang=${selectedMonth}&nam=${selectedYear}`
      );
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        // Map data từ sheet sang format hiển thị
        const attendanceFromSheet: AttendanceRecord[] = result.data.map((item: any) => ({
          stt: item.stt,
          hoTen: item.hoTen,
          chucVu: item.chucVu,
          attendance: item.days.map((status: string, index: number) =>
            sheetToPageStatus(status, index)
          ),
        }));
        setAttendanceData(attendanceFromSheet);
      } else {
        // Không có data cho tháng này
        setAttendanceData([]);
        toast("Không có dữ liệu chấm công cho tháng này", { icon: "ℹ️" });
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast.error("Lỗi khi tải dữ liệu chấm công");
      setAttendanceData([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const saveAttendanceToSheet = async () => {
    setIsSavingAttendance(true);
    try {
      const dataToSave = attendanceData.map((record) => ({
        stt: record.stt,
        hoTen: record.hoTen,
        chucVu: record.chucVu,
        thang: selectedMonth,
        nam: selectedYear,
        days: Array.from({ length: 31 }, (_, i) => {
          if (i < record.attendance.length) {
            return pageToSheetStatus(record.attendance[i]);
          }
          return "";
        }),
        tongCong: record.attendance.filter((a) => a === "present" || a === "late").length,
      }));

      const response = await fetch("/api/cham-cong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSave }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Đã lưu chấm công tháng ${selectedMonth}/${selectedYear}!`);
        setHasUnsavedChanges(false);
        setIsEditingAttendance(false);
      } else {
        toast.error(`Lỗi: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      toast.error(`Lỗi khi lưu chấm công: ${error.message}`);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const handleToggleAttendance = (stt: number, dayIndex: number) => {
    setHasUnsavedChanges(true);
    setAttendanceData((prev) =>
      prev.map((record) => {
        if (record.stt !== stt) return record;

        const newAttendance = [...record.attendance];
        const currentStatus = newAttendance[dayIndex];

        if (currentStatus === "future") return record;

        // Cycle: present -> late -> absent -> off -> present
        if (currentStatus === "present") {
          newAttendance[dayIndex] = "late";
        } else if (currentStatus === "late") {
          newAttendance[dayIndex] = "absent";
        } else if (currentStatus === "absent") {
          newAttendance[dayIndex] = "off";
        } else {
          newAttendance[dayIndex] = "present";
        }

        return { ...record, attendance: newAttendance };
      })
    );
  };

  const handleMarkAllPresentToday = () => {
    if (!isCurrentMonth) return;
    setHasUnsavedChanges(true);
    const todayIndex = currentDay - 1;
    setAttendanceData((prev) =>
      prev.map((record) => {
        const newAttendance = [...record.attendance];
        newAttendance[todayIndex] = "present";
        return { ...record, attendance: newAttendance };
      })
    );
  };

  const handleMarkAllAbsentToday = () => {
    if (!isCurrentMonth) return;
    setHasUnsavedChanges(true);
    const todayIndex = currentDay - 1;
    setAttendanceData((prev) =>
      prev.map((record) => {
        const newAttendance = [...record.attendance];
        newAttendance[todayIndex] = "absent";
        return { ...record, attendance: newAttendance };
      })
    );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={loadAttendanceFromSheet}
            disabled={isLoadingAttendance}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={20} className={isLoadingAttendance ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Có mặt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Đi muộn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Vắng</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span>Nghỉ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-dashed border-gray-300 rounded"></div>
            <span>Chưa đến</span>
          </div>
        </div>
      </div>

      {isEditingAttendance ? (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-900 flex items-center gap-2">
                <Edit size={18} />
                Đang chỉnh sửa chấm công
              </p>
              <p className="text-sm text-green-700">
                Click vào ô để thay đổi trạng thái: Có mặt → Đi muộn → Vắng → Nghỉ
              </p>
            </div>
            <div className="flex gap-2">
              {isCurrentMonth && (
                <>
                  <button
                    onClick={handleMarkAllPresentToday}
                    disabled={isSavingAttendance}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    <Check size={16} />
                    Tất cả có mặt
                  </button>
                  <button
                    onClick={handleMarkAllAbsentToday}
                    disabled={isSavingAttendance}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    <X size={16} />
                    Tất cả vắng
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setIsEditingAttendance(false);
                  if (hasUnsavedChanges) {
                    loadAttendanceFromSheet();
                  }
                }}
                disabled={isSavingAttendance}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <X size={16} />
                Hủy
              </button>
              <button
                onClick={saveAttendanceToSheet}
                disabled={isSavingAttendance || !hasUnsavedChanges}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {isSavingAttendance ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Lưu chấm công
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setIsEditingAttendance(true)}
            disabled={attendanceData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit size={18} />
            Chỉnh sửa chấm công
          </button>
        </div>
      )}

      {isLoadingAttendance ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">
            Đang tải dữ liệu chấm công tháng {selectedMonth}/{selectedYear}...
          </span>
        </div>
      ) : attendanceData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <p className="text-lg">Không có dữ liệu chấm công cho tháng {selectedMonth}/{selectedYear}</p>
          <p className="text-sm mt-2">Vui lòng chọn tháng khác hoặc tạo dữ liệu mới</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-2 text-center font-medium text-gray-500 sticky left-0 bg-gray-50 min-w-[40px]">
                  STT
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-500 sticky left-[40px] bg-gray-50 min-w-[150px]">
                  Họ Và Tên
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-500 min-w-[120px]">
                  Chức Vụ
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(selectedYear, selectedMonth - 1, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = isCurrentMonth && day === currentDay;
                  const isFutureDay =
                    selectedYear > currentYear ||
                    (selectedYear === currentYear && selectedMonth > currentMonth) ||
                    (selectedYear === currentYear &&
                      selectedMonth === currentMonth &&
                      day > currentDay);
                  return (
                    <th
                      key={i}
                      className={`px-1 py-2 text-center font-medium min-w-[32px] ${
                        isToday
                          ? "bg-blue-600 text-white"
                          : isFutureDay
                          ? "bg-gray-100 text-gray-300"
                          : isWeekend
                          ? "bg-gray-200 text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {day}
                    </th>
                  );
                })}
                <th className="px-3 py-2 text-center font-medium text-gray-500 bg-blue-50">
                  Tổng
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceData.map((row) => {
                const totalPresent = row.attendance.filter((a) => a === "present").length;
                const totalLate = row.attendance.filter((a) => a === "late").length;
                const totalWorking = totalPresent + totalLate;
                return (
                  <tr key={row.stt} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-center text-gray-600 sticky left-0 bg-white">
                      {row.stt}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 sticky left-[40px] bg-white">
                      {row.hoTen}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {row.chucVu}
                      </span>
                    </td>
                    {row.attendance.map((status, i) => {
                      const day = i + 1;
                      const isToday = isCurrentMonth && day === currentDay;
                      const isFuture = status === "future";
                      return (
                        <td
                          key={i}
                          className={`px-1 py-2 text-center ${
                            isToday ? "bg-blue-100" : isFuture ? "bg-gray-50" : ""
                          }`}
                        >
                          {isFuture ? (
                            <div
                              className="w-6 h-6 mx-auto rounded bg-gray-100 border border-dashed border-gray-300 cursor-not-allowed"
                              title="Ngày chưa đến - không thể chấm công"
                            />
                          ) : (
                            <div
                              onClick={() =>
                                isEditingAttendance && handleToggleAttendance(row.stt, i)
                              }
                              className={`w-6 h-6 mx-auto rounded transition-all ${
                                isEditingAttendance
                                  ? "cursor-pointer hover:scale-110 hover:shadow-md"
                                  : "cursor-default"
                              } ${
                                status === "present"
                                  ? isEditingAttendance
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-green-500"
                                  : status === "late"
                                  ? isEditingAttendance
                                    ? "bg-yellow-500 hover:bg-yellow-600"
                                    : "bg-yellow-500"
                                  : status === "absent"
                                  ? isEditingAttendance
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-red-500"
                                  : isEditingAttendance
                                  ? "bg-gray-200 hover:bg-gray-300"
                                  : "bg-gray-200"
                              } ${isToday ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                              title={`${
                                status === "present"
                                  ? "Có mặt"
                                  : status === "late"
                                  ? "Đi muộn"
                                  : status === "absent"
                                  ? "Vắng"
                                  : "Nghỉ"
                              }${isEditingAttendance ? " - Click để thay đổi" : ""}`}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-semibold bg-blue-50">
                      <span className="text-blue-600">{totalWorking}</span>
                      {totalLate > 0 && (
                        <span className="text-yellow-600 text-xs ml-1">({totalLate})</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
