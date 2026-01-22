"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (date: string) => void;
  type: "date" | "month";
  className?: string;
}

export default function DatePicker({ value, onChange, type, className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value || new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDisplayValue = () => {
    if (!value) return "";
    const date = new Date(value);
    if (type === "month") {
      return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
    }
    return `${date.getDate()} Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
  };

  const handlePrevMonth = () => {
    if (type === "month") {
      // For month picker, change year
      setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    } else {
      // For date picker, change month
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    if (type === "month") {
      // For month picker, change year
      setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
    } else {
      // For date picker, change month
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    }
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formattedDate = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleMonthClick = () => {
    const formattedDate = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-01`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    if (type === "month") {
      const months = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
        "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
        "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
      ];

      return (
        <div className="grid grid-cols-3 gap-2 p-3">
          {months.map((month, index) => {
            const isSelected = value && new Date(value).getMonth() === index && new Date(value).getFullYear() === viewDate.getFullYear();
            return (
              <button
                key={index}
                onClick={() => {
                  const newDate = new Date(viewDate.getFullYear(), index, 1);
                  setViewDate(newDate);
                  const formattedDate = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-01`;
                  onChange(formattedDate);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {month}
              </button>
            );
          })}
        </div>
      );
    }

    const days = daysInMonth(viewDate);
    const firstDay = firstDayOfMonth(viewDate);
    const currentDate = value ? new Date(value) : null;

    const dayElements = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      dayElements.push(
        <div key={`empty-${i}`} className="text-center p-2"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= days; day++) {
      const isSelected = currentDate &&
        currentDate.getDate() === day &&
        currentDate.getMonth() === viewDate.getMonth() &&
        currentDate.getFullYear() === viewDate.getFullYear();

      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === viewDate.getMonth() &&
        new Date().getFullYear() === viewDate.getFullYear();

      dayElements.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`text-center p-2 rounded-lg text-sm font-medium transition-colors ${
            isSelected
              ? "bg-blue-600 text-white"
              : isToday
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 mb-2 px-3">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 px-3 pb-3">
          {dayElements}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        readOnly
        value={formatDisplayValue()}
        onClick={() => setIsOpen(!isOpen)}
        className={className}
        placeholder={type === "month" ? "Chọn tháng" : "Chọn ngày"}
      />

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-[320px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="text-sm font-semibold text-gray-900">
              {type === "month"
                ? `Năm ${viewDate.getFullYear()}`
                : `Tháng ${viewDate.getMonth() + 1}, ${viewDate.getFullYear()}`
              }
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {renderCalendar()}

          <div className="border-t border-gray-200 px-3 py-3">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
