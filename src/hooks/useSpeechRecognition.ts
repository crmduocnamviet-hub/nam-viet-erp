// src/hooks/useSpeechRecognition.ts

import { useState, useEffect, useRef, useCallback } from "react";

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  // Nâng cấp: Dùng ref để theo dõi việc người dùng chủ động dừng
  const stoppedIntentionallyRef = useRef(false);

  useEffect(() => {
    if (!SpeechRecognition) {
      setError("Trình duyệt không hỗ trợ Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Luôn để lắng nghe liên tục
    recognition.interimResults = true;
    recognition.lang = "vi-VN";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Ưu tiên kết quả cuối cùng
      const newTranscript = (finalTranscript || interimTranscript).trim();
      setTranscript(newTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error(`Lỗi nhận dạng giọng nói: ${event.error}`, event);
      setError(`Lỗi: ${event.error}`);
    };

    // NÂNG CẤP: Logic "Tự chữa lành" nằm ở đây
    recognition.onend = () => {
      // Chỉ khởi động lại nếu nó tự dừng mà không phải do người dùng
      if (!stoppedIntentionallyRef.current) {
        console.warn("Dịch vụ giọng nói tự dừng, đang khởi động lại...");
        // Thêm một khoảng trễ nhỏ để tránh vòng lặp vô hạn nếu lỗi xảy ra liên tục
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            startListening();
          }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      stoppedIntentionallyRef.current = false;
      setTranscript("");
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Lỗi khi gọi .start():", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      stoppedIntentionallyRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, error, startListening, stopListening };
};
