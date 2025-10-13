import React, { useState, useRef, useEffect } from "react";
import {
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
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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

  const handleLotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...value,
      lotNumber: e.target.value,
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
    <Space direction="vertical" style={{ width: "100%" }} size="small">
      <Row gutter={8}>
        <Col flex="auto">
          <Input
            placeholder={placeholder.lot}
            value={value.lotNumber}
            onChange={handleLotChange}
            disabled={disabled}
            prefix={<BarcodeOutlined />}
            suffix={
              <Space size={4}>
                <Tooltip title={isListening ? "Đang nghe..." : "Nói số lô"}>
                  <Button
                    type="text"
                    size="small"
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
                      size="small"
                      icon={<CameraOutlined />}
                      onClick={onScanLot}
                      disabled={disabled}
                    />
                  </Tooltip>
                )}
              </Space>
            }
          />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <DatePicker
            placeholder={placeholder.expiration}
            value={value.expirationDate ? dayjs(value.expirationDate) : null}
            onChange={handleDateChange}
            disabled={disabled}
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            disabledDate={(current) => {
              // Can't select dates before today
              return current && current < dayjs().startOf("day");
            }}
          />
        </Col>
      </Row>
    </Space>
  );
};

export default LotExpirationInput;
