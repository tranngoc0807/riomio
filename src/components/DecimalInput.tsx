"use client";

import { useEffect, useState } from "react";

// Parse số thập phân: chấp nhận cả "," (VN) lẫn "." làm dấu thập phân.
// Bỏ ký tự khoảng trắng. Trả 0 nếu không hợp lệ.
export const parseDecimal = (raw: string): number => {
  if (raw == null) return 0;
  const cleaned = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

// Input cho phép gõ số thập phân với dấu "," hoặc "." (VN). Giữ raw text local
// để user gõ "1," rồi tiếp "4" không bị reset về "1".
export default function DecimalInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState<string>(() =>
    value === 0 ? "" : String(value),
  );
  // Đồng bộ khi value bên ngoài đổi (vd reset form) nhưng không ghi đè khi
  // user đang gõ dở (parseDecimal(text) === value thì giữ nguyên text).
  useEffect(() => {
    if (parseDecimal(text) !== value) {
      setText(value === 0 ? "" : String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseDecimal(e.target.value));
      }}
      className={className}
    />
  );
}
