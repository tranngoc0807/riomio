"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface CalendarProps {
  value: string; // yyyy-mm-dd format
  onChange: (date: string) => void;
  disabled?: boolean;
  placeholder?: string;
  position?: "left" | "right"; // Position of dropdown
}

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Calendar({ value, onChange, disabled, placeholder = "dd/mm/yyyy", position = "left" }: CalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        setViewDate(parsed);
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

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert to Monday-based (0 = Monday)
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleDone = () => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
    }
    setIsOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  // Build calendar grid
  const calendarDays: { day: number; isCurrentMonth: boolean }[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true });
  }

  // Next month days
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false });
  }

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
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <CalendarIcon size={16} className="text-gray-400 ml-auto" />
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className={`absolute top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 w-70 ${position === "right" ? "right-0" : "left-0"}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <span className="font-medium text-gray-900">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => item.isCurrentMonth && handleDateClick(item.day)}
                disabled={!item.isCurrentMonth}
                className={`
                  w-9 h-9 text-sm rounded-lg transition-colors
                  ${!item.isCurrentMonth
                    ? "text-gray-300 cursor-default"
                    : isSelected(item.day)
                      ? "bg-blue-600 text-white font-medium"
                      : isToday(item.day)
                        ? "border-2 border-blue-600 text-blue-600 font-medium hover:bg-blue-50"
                        : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {item.day}
              </button>
            ))}
          </div>

          {/* Done button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleDone}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
