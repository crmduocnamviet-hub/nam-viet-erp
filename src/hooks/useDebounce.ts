import { useState, useEffect } from "react";

// Đây là "bộ não" của người trợ lý
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Chỉ cập nhật giá trị sau một khoảng thời gian chờ (delay)
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy bỏ việc chờ nếu giá trị thay đổi
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
