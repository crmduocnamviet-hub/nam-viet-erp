import { FormInstance } from "antd";
import dayjs from "dayjs";

export interface OrderItem {
  product_name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  packaging?: string;
  key?: string;
  product_id?: string | number;
}

export interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface OrderFormValues {
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  delivery_address?: string;
  discount_percent?: number;
  tax_percent?: number;
  notes?: string;
}

export interface Employee {
  full_name?: string;
}

/**
 * Format currency to Vietnamese Dong
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Generate HTML content for B2B order PDF
 */
export const generateB2BOrderPdfContent = (
  orderItems: IB2BQuoteItem[],
  totals: OrderTotals,
  formValues: OrderFormValues,
  employee?: Employee | null
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Báo giá - ${formValues.customer_name || "Khách hàng"}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .header h1 { margin: 0; color: #1890ff; }
        .info-section { margin: 20px 0; }
        .info-row { display: flex; margin-bottom: 10px; }
        .info-label { font-weight: bold; width: 150px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #1890ff; color: white; }
        .total-section { margin-top: 30px; text-align: right; }
        .total-row { margin: 10px 0; font-size: 16px; }
        .total-row.final { font-size: 20px; font-weight: bold; color: #1890ff; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BÁO GIÁ / ĐƠN HÀNG B2B</h1>
        <p>Ngày tạo: ${dayjs().format("DD/MM/YYYY HH:mm")}</p>
      </div>

      <div class="info-section">
        <h3>Thông tin khách hàng</h3>
        <div class="info-row">
          <div class="info-label">Tên khách hàng:</div>
          <div>${formValues.customer_name || ""}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Số điện thoại:</div>
          <div>${formValues.customer_phone || ""}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Địa chỉ:</div>
          <div>${formValues.customer_address || ""}</div>
        </div>
        ${
          formValues.delivery_address
            ? `<div class="info-row">
            <div class="info-label">Địa chỉ giao hàng:</div>
            <div>${formValues.delivery_address}</div>
          </div>`
            : ""
        }
      </div>

      <div class="info-section">
        <h3>Danh sách sản phẩm</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">STT</th>
              <th>Tên sản phẩm</th>
              <th style="width: 100px;">Đơn vị</th>
              <th style="width: 100px;">Số lượng</th>
              <th style="width: 120px;">Đơn giá</th>
              <th style="width: 150px;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems
              .map(
                (item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.product_name}</td>
                <td>${item.unit || "Hộp"}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${formatCurrency(
                  item.unit_price
                )}</td>
                <td style="text-align: right;">${formatCurrency(
                  item.total_price
                )}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <div class="total-row">Tạm tính: ${formatCurrency(
          totals.subtotal
        )}</div>
        <div class="total-row">Chiết khấu (${
          formValues.discount_percent || 0
        }%): -${formatCurrency(totals.discountAmount)}</div>
        <div class="total-row">Thuế (${
          formValues.tax_percent || 0
        }%): +${formatCurrency(totals.taxAmount)}</div>
        <div class="total-row final">Tổng cộng: ${formatCurrency(
          totals.totalAmount
        )}</div>
      </div>

      ${
        formValues.notes
          ? `<div class="info-section">
          <h3>Ghi chú</h3>
          <p>${formValues.notes}</p>
        </div>`
          : ""
      }

      <div class="footer">
        <p>Nhân viên tạo: ${employee?.full_name || ""}</p>
        <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Export B2B order to PDF by opening print dialog
 */
export const exportB2BOrderToPdf = (
  orderItems: IB2BQuoteItem[],
  totals: OrderTotals,
  formValues: OrderFormValues,
  employee?: Employee | null
): { success: boolean; error?: string } => {
  try {
    // Validate order items
    if (orderItems.length === 0) {
      return {
        success: false,
        error: "Vui lòng thêm sản phẩm vào đơn hàng trước khi xuất PDF.",
      };
    }

    // Generate HTML content
    const printContent = generateB2BOrderPdfContent(
      orderItems,
      totals,
      formValues,
      employee
    );

    // Open print dialog
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      return {
        success: false,
        error: "Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.",
      };
    }

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);

    return { success: true };
  } catch (error: any) {
    console.error("Error exporting PDF:", error);
    return {
      success: false,
      error: error.message || "Không thể xuất PDF. Vui lòng thử lại.",
    };
  }
};

export const calculateTotals = (
  orderItems: IB2BQuoteItem[],
  form: FormInstance
) => {
  const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
  const discountPercent = form.getFieldValue("discount_percent") || 0;
  const taxPercent = form.getFieldValue("tax_percent") || 0;

  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const totalAmount = taxableAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
    itemCount: orderItems.length,
    totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
  };
};
