"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface MonthPickerProps {
  value: string; // yyyy-MM format
  onChange: (month: string) => void;
  disabled?: boolean;
  placeholder?: string;
  position?: "left" | "right";
}

const MONTHS = [
  { short: "Jan", full: "January", num: "01" },
  { short: "Feb", full: "February", num: "02" },
  { short: "Mar", full: "March", num: "03" },
  { short: "Apr", full: "April", num: "04" },
  { short: "May", full: "May", num: "05" },
  { short: "Jun", full: "June", num: "06" },
  { short: "Jul", full: "July", num: "07" },
  { short: "Aug", full: "August", num: "08" },
  { short: "Sep", full: "September", num: "09" },
  { short: "Oct", full: "October", num: "10" },
  { short: "Nov", full: "November", num: "11" },
  { short: "Dec", full: "December", num: "12" },
];

export default function MonthPicker({ value, onChange, disabled, placeholder = "mm/yyyy", position = "left" }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 2) return parseInt(parts[0]);
    }
    return new Date().getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | null>(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 2) {
        return { year: parseInt(parts[0]), month: parseInt(parts[1]) };
      }
    }
    return null;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 2) {
        setSelectedMonth({ year: parseInt(parts[0]), month: parseInt(parts[1]) });
        setViewYear(parseInt(parts[0]));
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevYear = () => {
    setViewYear(viewYear - 1);
  };

  const handleNextYear = () => {
    setViewYear(viewYear + 1);
  };

  const handleMonthClick = (monthNum: number) => {
    setSelectedMonth({ year: viewYear, month: monthNum });
  };

  const handleDone = () => {
    if (selectedMonth) {
      const month = String(selectedMonth.month).padStart(2, "0");
      onChange(`${selectedMonth.year}-${month}`);
    }
    setIsOpen(false);
  };

  const formatDisplayMonth = (monthStr: string) => {
    if (!monthStr) return "";
    const parts = monthStr.split("-");
    if (parts.length === 2) {
      return `${parseInt(parts[1])}/${parts[0]}`;
    }
    return monthStr;
  };

  const isSelected = (monthNum: number) => {
    if (!selectedMonth) return false;
    return selectedMonth.month === monthNum && selectedMonth.year === viewYear;
  };

  const isCurrentMonth = (monthNum: number) => {
    const now = new Date();
    return now.getMonth() + 1 === monthNum && now.getFullYear() === viewYear;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-full text-left ${
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-gray-400 bg-white"
        }`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? formatDisplayMonth(value) : placeholder}
        </span>
        <CalendarIcon size={16} className="text-gray-400 ml-auto" />
      </button>

      {/* Month picker dropdown */}
      {isOpen && (
        <div className={`absolute top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 w-70 ${position === "right" ? "right-0" : "left-0"}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevYear}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <span className="font-medium text-gray-900">{viewYear}</span>
            <button
              type="button"
              onClick={handleNextYear}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Months grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, index) => (
              <button
                key={month.num}
                type="button"
                onClick={() => handleMonthClick(index + 1)}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors
                  ${isSelected(index + 1)
                    ? "bg-purple-600 text-white font-medium"
                    : isCurrentMonth(index + 1)
                      ? "border-2 border-purple-600 text-purple-600 font-medium hover:bg-purple-50"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {month.short}
              </button>
            ))}
          </div>

          {/* Done button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleDone}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
