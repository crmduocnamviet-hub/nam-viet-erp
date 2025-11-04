import React from "react";
import { Divider, Row, Col, Typography } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const { Title, Text } = Typography;

interface PrintableReceiptProps {
  transaction: ITransaction;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    taxCode: string;
  };
}

/**
 * Component để in/xuất phiếu thu chi
 * Thiết kế theo chuẩn phiếu thu/chi kế toán Việt Nam
 */
const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  transaction,
  companyInfo = {
    name: "CÔNG TY TNHH NAM VIỆT ERP",
    address: "Địa chỉ công ty",
    phone: "Số điện thoại",
    taxCode: "Mã số thuế",
  },
}) => {
  const isIncome = transaction.type === "income";
  const receiptType = isIncome ? "PHIẾU THU" : "PHIẾU CHI";
  const receiptColor = isIncome ? "#52c41a" : "#ff4d4f";

  // Chuyển số thành chữ
  const numberToVietnameseWords = (num: number): string => {
    if (num === 0) return "Không đồng";

    const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ"];
    const digits = [
      "",
      "một",
      "hai",
      "ba",
      "bốn",
      "năm",
      "sáu",
      "bảy",
      "tám",
      "chín",
    ];

    const readGroup = (n: number): string => {
      let result = "";
      const hundred = Math.floor(n / 100);
      const ten = Math.floor((n % 100) / 10);
      const unit = n % 10;

      if (hundred > 0) {
        result += digits[hundred] + " trăm ";
        if (ten === 0 && unit !== 0) result += "linh ";
      }

      if (ten > 1) {
        result += digits[ten] + " mươi ";
        if (unit === 1) {
          result += "mốt ";
        } else if (unit > 0) {
          result += digits[unit] + " ";
        }
      } else if (ten === 1) {
        result += "mười ";
        if (unit > 0) {
          result += digits[unit] + " ";
        }
      } else if (unit > 0) {
        result += digits[unit] + " ";
      }

      return result.trim();
    };

    let result = "";
    let unitIndex = 0;

    while (num > 0) {
      const group = num % 1000;
      if (group > 0) {
        result = readGroup(group) + " " + units[unitIndex] + " " + result;
      }
      num = Math.floor(num / 1000);
      unitIndex++;
    }

    // Capitalize first letter
    result = result.trim().charAt(0).toUpperCase() + result.trim().slice(1);
    return result + " đồng";
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  return (
    <div
      id="printable-receipt"
      style={{
        padding: "40px",
        backgroundColor: "#fff",
        maxWidth: "210mm", // A4 width
        margin: "0 auto",
        fontFamily: "Times New Roman, serif",
      }}
    >
      {/* Header - Company Info */}
      <Row justify="space-between" style={{ marginBottom: 20 }}>
        <Col span={12}>
          <div style={{ textAlign: "left" }}>
            <Text strong style={{ fontSize: 14 }}>
              {companyInfo.name}
            </Text>
            <br />
            <Text style={{ fontSize: 12 }}>{companyInfo.address}</Text>
            <br />
            <Text style={{ fontSize: 12 }}>ĐT: {companyInfo.phone}</Text>
            <br />
            <Text style={{ fontSize: 12 }}>MST: {companyInfo.taxCode}</Text>
          </div>
        </Col>
        <Col span={12} style={{ textAlign: "right" }}>
          <Text style={{ fontSize: 12 }}>Mẫu số: 01-TT</Text>
          <br />
          <Text style={{ fontSize: 12 }}>
            (Ban hành theo QĐ số 48/2006/QĐ-BTC
            <br />
            Ngày 14/09/2006 của Bộ trưởng BTC)
          </Text>
        </Col>
      </Row>

      {/* Receipt Title */}
      <div style={{ textAlign: "center", marginTop: 30, marginBottom: 20 }}>
        <Title
          level={2}
          style={{
            marginBottom: 8,
            fontWeight: "bold",
            color: receiptColor,
            fontSize: 24,
          }}
        >
          {receiptType}
        </Title>
        <Text style={{ fontSize: 13 }}>
          Ngày {dayjs(transaction.transaction_date).format("DD")} tháng{" "}
          {dayjs(transaction.transaction_date).format("MM")} năm{" "}
          {dayjs(transaction.transaction_date).format("YYYY")}
        </Text>
        <br />
        <Text style={{ fontSize: 12, fontStyle: "italic" }}>
          Số phiếu: {transaction.id.toString().padStart(6, "0")}
        </Text>
      </div>

      <Divider style={{ margin: "20px 0", borderColor: "#000" }} />

      {/* Receipt Body */}
      <div style={{ fontSize: 14, lineHeight: 2 }}>
        <Row style={{ marginBottom: 12 }}>
          <Col span={5}>
            <Text strong>
              {isIncome
                ? "Họ và tên người nộp tiền:"
                : "Họ và tên người nhận tiền:"}
            </Text>
          </Col>
          <Col span={19}>
            <Text style={{ borderBottom: "1px dotted #000", paddingBottom: 2 }}>
              {transaction.recipient_name ||
                transaction.created_by ||
                "_______________"}
            </Text>
          </Col>
        </Row>

        <Row style={{ marginBottom: 12 }}>
          <Col span={3}>
            <Text strong>Địa chỉ:</Text>
          </Col>
          <Col span={21}>
            <Text style={{ borderBottom: "1px dotted #000", paddingBottom: 2 }}>
              _________________________________________________________________
            </Text>
          </Col>
        </Row>

        <Row style={{ marginBottom: 12 }}>
          <Col span={3}>
            <Text strong>Lý do {isIncome ? "thu" : "chi"}:</Text>
          </Col>
          <Col span={21}>
            <Text style={{ borderBottom: "1px dotted #000", paddingBottom: 2 }}>
              {transaction.description || "_______________"}
            </Text>
          </Col>
        </Row>

        <Row style={{ marginBottom: 12 }}>
          <Col span={3}>
            <Text strong>Số tiền:</Text>
          </Col>
          <Col span={21}>
            <Text
              strong
              style={{
                fontSize: 16,
                color: receiptColor,
                borderBottom: "1px dotted #000",
                paddingBottom: 2,
              }}
            >
              {formatCurrency(transaction.amount)} đồng
            </Text>
          </Col>
        </Row>

        <Row style={{ marginBottom: 12 }}>
          <Col span={3}>
            <Text strong>Bằng chữ:</Text>
          </Col>
          <Col span={21}>
            <Text
              italic
              style={{
                fontSize: 14,
                borderBottom: "1px dotted #000",
                paddingBottom: 2,
              }}
            >
              {numberToVietnameseWords(transaction.amount)}
            </Text>
          </Col>
        </Row>

        {transaction.payment_method === "bank" && (
          <>
            <Row style={{ marginBottom: 12 }}>
              <Col span={5}>
                <Text strong>Hình thức thanh toán:</Text>
              </Col>
              <Col span={19}>
                <Text
                  style={{ borderBottom: "1px dotted #000", paddingBottom: 2 }}
                >
                  Chuyển khoản
                </Text>
              </Col>
            </Row>

            {transaction.recipient_bank && (
              <Row style={{ marginBottom: 12 }}>
                <Col span={3}>
                  <Text strong>Ngân hàng:</Text>
                </Col>
                <Col span={21}>
                  <Text
                    style={{
                      borderBottom: "1px dotted #000",
                      paddingBottom: 2,
                    }}
                  >
                    {transaction.recipient_bank}
                  </Text>
                </Col>
              </Row>
            )}

            {transaction.recipient_account && (
              <Row style={{ marginBottom: 12 }}>
                <Col span={3}>
                  <Text strong>Số tài khoản:</Text>
                </Col>
                <Col span={21}>
                  <Text
                    style={{
                      borderBottom: "1px dotted #000",
                      paddingBottom: 2,
                    }}
                  >
                    {transaction.recipient_account}
                  </Text>
                </Col>
              </Row>
            )}
          </>
        )}

        {transaction.payment_method === "cash" && (
          <Row style={{ marginBottom: 12 }}>
            <Col span={5}>
              <Text strong>Hình thức thanh toán:</Text>
            </Col>
            <Col span={19}>
              <Text
                style={{ borderBottom: "1px dotted #000", paddingBottom: 2 }}
              >
                Tiền mặt
              </Text>
            </Col>
          </Row>
        )}

        <Row style={{ marginBottom: 12 }}>
          <Col span={3}>
            <Text strong>Kèm theo:</Text>
          </Col>
          <Col span={21}>
            <Text style={{ borderBottom: "1px dotted #000", paddingBottom: 2 }}>
              {transaction.attachments && transaction.attachments.length > 0
                ? `${transaction.attachments.length} chứng từ gốc`
                : "Không có chứng từ kèm theo"}
            </Text>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: "30px 0", borderColor: "#000" }} />

      {/* Signatures */}
      <Row
        justify="space-around"
        style={{ marginTop: 40, textAlign: "center" }}
      >
        <Col span={6}>
          <Text strong style={{ fontSize: 13 }}>
            Giám đốc
          </Text>
          <br />
          <Text style={{ fontSize: 11, fontStyle: "italic" }}>
            (Ký, họ tên, đóng dấu)
          </Text>
          <div style={{ height: 80 }} />
          <Text style={{ fontSize: 12 }}>____________________</Text>
        </Col>

        <Col span={6}>
          <Text strong style={{ fontSize: 13 }}>
            Kế toán trưởng
          </Text>
          <br />
          <Text style={{ fontSize: 11, fontStyle: "italic" }}>
            (Ký, họ tên)
          </Text>
          <div style={{ height: 80 }} />
          <Text style={{ fontSize: 12 }}>
            {transaction.approved_by || "____________________"}
          </Text>
        </Col>

        <Col span={6}>
          <Text strong style={{ fontSize: 13 }}>
            {isIncome ? "Người nộp tiền" : "Người nhận tiền"}
          </Text>
          <br />
          <Text style={{ fontSize: 11, fontStyle: "italic" }}>
            (Ký, họ tên)
          </Text>
          <div style={{ height: 80 }} />
          <Text style={{ fontSize: 12 }}>
            {transaction.recipient_name || "____________________"}
          </Text>
        </Col>

        <Col span={6}>
          <Text strong style={{ fontSize: 13 }}>
            Thủ quỹ
          </Text>
          <br />
          <Text style={{ fontSize: 11, fontStyle: "italic" }}>
            (Ký, họ tên)
          </Text>
          <div style={{ height: 80 }} />
          <Text style={{ fontSize: 12 }}>
            {transaction.executed_by || "____________________"}
          </Text>
        </Col>
      </Row>

      {/* Footer Note */}
      <div style={{ marginTop: 30, textAlign: "center" }}>
        <Text
          style={{
            fontSize: 11,
            fontStyle: "italic",
            color: "#666",
          }}
        >
          Ngày in: {dayjs().format("DD/MM/YYYY HH:mm")}
        </Text>
      </div>

      {/* Print-only styles */}
      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }

            #printable-receipt {
              padding: 20mm;
              max-width: 100%;
            }

            /* Hide everything except the receipt */
            body > *:not(#printable-receipt) {
              display: none !important;
            }

            /* Page break settings */
            #printable-receipt {
              page-break-after: avoid;
              page-break-inside: avoid;
            }

            /* Remove background colors for print */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PrintableReceipt;
