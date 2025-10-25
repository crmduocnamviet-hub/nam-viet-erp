import React, { useRef, useEffect } from "react";
import { DatePicker, DatePickerProps } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface DateInputProps extends Omit<DatePickerProps, "value" | "onChange"> {
  value?: string | Dayjs | null;
  onChange?: (value: string | null, dateString: string) => void;
}

/**
 * DateInput component with DD/MM/YYYY format
 * Supports shorthand input: typing 6 digits (ddmmyy) will auto-format to dd/mm/20yy
 *
 * @example
 * // In Form
 * <Form.Item name="date_of_birth">
 *   <DateInput placeholder="DD/MM/YYYY or ddmmyy" />
 * </Form.Item>
 *
 * @example
 * // Controlled component
 * <DateInput
 *   value={dateValue}
 *   onChange={(value) => setDateValue(value)}
 * />
 *
 * @example
 * // Shorthand input
 * // Type: 010125 → Auto-formats to: 01/01/2025
 * // Type: 151224 → Auto-formats to: 15/12/2024
 */
const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  format = "DD/MM/YYYY",
  placeholder = "DD/MM/YYYY",
  style = { width: "100%" },
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert string value to dayjs object
  const dayjsValue = value
    ? typeof value === "string"
      ? dayjs(value)
      : value
    : null;

  const handleChange = (date: Dayjs | null, dateString: string) => {
    if (onChange) {
      // Convert dayjs to YYYY-MM-DD format for database storage
      const formattedDate = date ? date.format("YYYY-MM-DD") : null;
      onChange(formattedDate, dateString);
    }
  };

  // Add event listener to handle shorthand date input (ddmmyy)
  useEffect(() => {
    if (!containerRef.current) return;

    const inputElement = containerRef.current.querySelector("input");
    if (!inputElement) return;

    const handleKeyUp = (e: Event) => {
      const input = e.target as HTMLInputElement;
      const rawValue = input.value.replace(/\D/g, ""); // Remove non-digits

      // Check if exactly 6 digits were entered
      if (rawValue.length === 6) {
        const day = rawValue.substring(0, 2);
        const month = rawValue.substring(2, 4);
        const year = "20" + rawValue.substring(4, 6);

        // Validate and create date
        const parsedDate = dayjs(`${year}-${month}-${day}`, "YYYY-MM-DD");

        if (parsedDate.isValid()) {
          // Trigger onChange with the parsed date
          if (onChange) {
            onChange(
              parsedDate.format("YYYY-MM-DD"),
              parsedDate.format("DD/MM/YYYY"),
            );
          }
        }
      }
    };

    inputElement.addEventListener("keyup", handleKeyUp);

    return () => {
      inputElement.removeEventListener("keyup", handleKeyUp);
    };
  }, [onChange]);

  return (
    <div
      ref={containerRef}
      style={{ display: "inline-block", width: style?.width || "100%" }}
    >
      <DatePicker
        {...rest}
        value={dayjsValue}
        onChange={handleChange}
        format={format}
        placeholder={placeholder}
        style={{ ...style, width: "100%" }}
      />
    </div>
  );
};

export default DateInput;
