// src/features/warehouse/components/SpeechToTextInput.tsx

import React, { useState, useEffect } from "react";
import { Input, Button, Tooltip } from "antd";
import { AudioOutlined, AudioMutedOutlined } from "@ant-design/icons";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";

interface SpeechToTextInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm?: (value: string) => void;
}

export default function SpeechToTextInput({
  value,
  onChange,
  onConfirm,
}: SpeechToTextInputProps) {
  const [internalValue, setInternalValue] = useState(value || "");
  const { isListening, transcript, startListening, stopListening, error } =
    useSpeechRecognition();

  console.log("[SENKO DEBUG] SpeechToTextInput re-render. State hiện tại:", {
    isListening,
    transcript,
    error,
  });

  useEffect(() => {
    if (transcript) {
      console.log(
        `[SENKO DEBUG] Transcript thay đổi, đang cập nhật input: "${transcript}"`
      );
      const cleanedTranscript = transcript.replace(/\.$/, "").trim();
      setInternalValue(cleanedTranscript);
      if (onConfirm) {
        onConfirm(cleanedTranscript);
      }
    }
  }, [transcript, onConfirm]);

  useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  const handleToggleListening = () => {
    console.log(
      "[SENKO DEBUG] Nút micro đã được bấm. Trạng thái isListening hiện tại:",
      isListening
    );
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <Input
      value={internalValue}
      onChange={handleInputChange}
      placeholder={error ? "Lỗi: " + error : "Nhập hoặc bấm micro để nói"}
      addonAfter={
        <Tooltip title={isListening ? "Dừng ghi âm" : "Bắt đầu ghi âm"}>
          <Button
            type={isListening ? "primary" : "default"}
            danger={isListening}
            icon={isListening ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={handleToggleListening}
            disabled={!!error}
          />
        </Tooltip>
      }
    />
  );
}
