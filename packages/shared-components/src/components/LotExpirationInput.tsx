import React, { useState, useRef, useEffect } from "react";
import {
  AutoComplete,
  Input,
  DatePicker,
  Space,
  Button,
  Tooltip,
  Row,
  Col,
  message,
} from "antd";
import {
  CameraOutlined,
  BarcodeOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { searchProductLots } from "@nam-viet-erp/services";

interface LotExpirationInputProps {
  value?: {
    lotNumber?: string;
    expirationDate?: string;
  };
  onChange?: (value: { lotNumber?: string; expirationDate?: string }) => void;
  onScanLot?: () => void;
  disabled?: boolean;
  placeholder?: {
    lot?: string;
    expiration?: string;
  };
  productId?: number;
  warehouseId?: number;
  showLotNumberInput?: boolean;
}

const LotExpirationInput: React.FC<LotExpirationInputProps> = ({
  value = {},
  onChange,
  onScanLot,
  disabled = false,
  placeholder = {
    lot: "Nhập số lô",
    expiration: "Chọn hạn sử dụng",
  },
  productId,
  warehouseId,
  showLotNumberInput = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [options, setOptions] = useState<{ value: string }[]>([]);
  const [searchText, setSearchText] = useState("");

  // Debounce search
  useEffect(() => {
    if (!searchText || !productId) {
      setOptions([]);
      return;
    }

    const handler = setTimeout(() => {
      searchProductLots(productId, searchText, warehouseId).then((results) => {
        setOptions(results);
      });
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText, productId, warehouseId]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "vi-VN"; // Vietnamese

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Clean up the transcript (remove spaces, special chars for lot numbers)
        const cleanedText = transcript.trim();
        onChange?.({
          ...value,
          lotNumber: cleanedText,
        });
        message.success(`Đã nhận: ${cleanedText}`);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        message.error("Không thể nhận dạng giọng nói. Vui lòng thử lại.");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleLotSearch = (text: string) => {
    setSearchText(text);
  };

  const handleLotChange = (data: string) => {
    onChange?.({
      ...value,
      lotNumber: data,
    });
  };

  const handleDateChange = (date: any) => {
    onChange?.({
      ...value,
      expirationDate: date ? date.format("YYYY-MM-DD") : undefined,
    });
  };

  const handleSpeechToText = () => {
    if (!recognitionRef.current) {
      message.error("Trình duyệt không hỗ trợ nhận dạng giọng nói");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        message.info("Đang lắng nghe... Hãy nói số lô");
      } catch (error) {
        console.error("Error starting recognition:", error);
        message.error("Không thể bắt đầu nhận dạng giọng nói");
        setIsListening(false);
      }
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%", gap: 20 }}>
      {showLotNumberInput && (
        <Row gutter={8}>
          <Col>
            <AutoComplete
              options={options}
              onSearch={handleLotSearch}
              onChange={handleLotChange}
              value={value.lotNumber}
              disabled={disabled || !productId}
              style={{ width: 200 }}
            >
              <Input
                placeholder={placeholder.lot}
                prefix={<BarcodeOutlined />}
                suffix={
                  <Space size={4}>
                    <Tooltip title={isListening ? "Đang nghe..." : "Nói số lô"}>
                      <Button
                        type="text"
                        icon={<AudioOutlined />}
                        onClick={handleSpeechToText}
                        disabled={disabled}
                        style={{
                          color: isListening ? "#ff4d4f" : undefined,
                        }}
                      />
                    </Tooltip>
                    {onScanLot && (
                      <Tooltip title="Quét mã lô">
                        <Button
                          type="text"
                          icon={<CameraOutlined />}
                          onClick={onScanLot}
                          disabled={disabled}
                        />
                      </Tooltip>
                    )}
                  </Space>
                }
              />
            </AutoComplete>
          </Col>
        </Row>
      )}
      {showLotNumberInput && (
        <Row>
          <Col>
            <DatePicker
              placeholder={placeholder.expiration}
              value={value.expirationDate ? dayjs(value.expirationDate) : null}
              onChange={handleDateChange}
              disabled={disabled}
              format="DD/MM/YYYY"
              disabledDate={(current) => {
                // Can't select dates before today
                return current && current < dayjs().startOf("day");
              }}
              size="large"
              style={{ width: 200 }}
            />
          </Col>
        </Row>
      )}
    </Space>
  );
};

export default LotExpirationInput;
