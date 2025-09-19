// src/features/finance/components/CashDenominationCounter.tsx

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  InputNumber,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
} from "antd";

const { Text } = Typography;

const denominationsList = [
  500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200,
];

interface CashDenominationCounterProps {
  // Bắt buộc phải có để tính toán
  targetAmount: number;
  // Dữ liệu bảng kê ban đầu (nếu có, dùng cho thủ quỹ đối soát)
  initialCounts?: Record<number, number> | null;
  // Callback trả về tổng tiền và chi tiết bảng kê
  onConfirm?: (total: number, counts: Record<number, number>) => void;
  // Chế độ chỉ xem
  readOnly?: boolean;
}

const CashDenominationCounter: React.FC<CashDenominationCounterProps> = ({
  targetAmount,
  initialCounts = null,
  onConfirm,
  readOnly = false,
}) => {
  const [counts, setCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    // Khi ở chế độ chỉ xem, hiển thị dữ liệu được truyền vào
    if (readOnly && initialCounts) {
      setCounts(initialCounts);
    }
  }, [readOnly, initialCounts]);

  const handleCountChange = (value: number | null, denomination: number) => {
    setCounts((prev) => ({ ...prev, [denomination]: value || 0 }));
  };

  const totalCalculated = useMemo(() => {
    return Object.entries(counts).reduce((sum, [denom, count]) => {
      return sum + Number(denom) * count;
    }, 0);
  }, [counts]);

  // So sánh với số tiền gốc của giao dịch
  const difference = totalCalculated - targetAmount;

  return (
    <Card
      title={initialCounts ? "Bảng Kê Đối Soát" : "Bảng Kê Tiền Mặt"}
      size="small"
      style={{ background: "#fafafa" }}
    >
      <div
        style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "10px" }}
      >
        {denominationsList.map((denom) => (
          <Row key={denom} align="middle" style={{ marginBottom: 8 }}>
            <Col span={10}>
              <Text strong>{denom.toLocaleString("vi-VN")} đ</Text>
            </Col>
            <Col span={4} style={{ textAlign: "center" }}>
              x
            </Col>
            <Col span={10}>
              <InputNumber
                readOnly={readOnly}
                value={counts[denom]}
                onChange={(value) => handleCountChange(value, denom)}
                min={0}
                style={{ width: "100%" }}
                placeholder="Số tờ"
              />
            </Col>
          </Row>
        ))}
      </div>
      <div
        style={{
          marginTop: 16,
          borderTop: "1px solid #f0f0f0",
          paddingTop: 16,
        }}
      >
        <Statistic
          title="Tổng tiền đếm được"
          value={totalCalculated}
          precision={0}
          valueStyle={{
            color:
              difference === 0 ? "#52c41a" : readOnly ? "#1890ff" : "#cf1322",
          }}
          suffix="VNĐ"
        />
        {targetAmount > 0 &&
          (difference !== 0 ? (
            <Tag
              color={difference > 0 ? "geekblue" : "volcano"}
              style={{ marginTop: 8 }}
            >
              {difference > 0
                ? `Thừa ${difference.toLocaleString("vi-VN")} đ`
                : `Thiếu ${(-difference).toLocaleString("vi-VN")} đ`}
            </Tag>
          ) : (
            <Tag color="success" style={{ marginTop: 8 }}>
              KHỚP
            </Tag>
          ))}
      </div>
      {onConfirm && (
        <Button
          type="primary"
          style={{ marginTop: 16, width: "100%" }}
          onClick={() => onConfirm(totalCalculated, counts)}
        >
          Xác nhận
        </Button>
      )}
    </Card>
  );
};

export default CashDenominationCounter;
