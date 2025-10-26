import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyAADq1wEZmm6m8RhyrVHKMPO_c0iNrX700",
});

export const analyticImage = async (path: string) => {
  const myfile = await ai.files.upload({
    file: path,
    config: { mimeType: "image/jpeg" },
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: createUserContent([
      createPartFromUri(path, myfile.mimeType ?? "image/jpeg"),
      "Caption this image.",
    ]),
  });

  return response;
};

/**
 * Analyze image from File object (browser)
 * Convert File to base64 then analyze with Gemini
 */
export const analyticImageFromFile = async (
  file: File,
  prompt?: string,
): Promise<{ text: string; data: any }> => {
  try {
    // Convert File to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,...)
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Use inline data instead of file upload
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type || "image/jpeg",
              },
            },
            {
              text:
                prompt ||
                "Analyze this image and provide detailed information about what you see.",
            },
          ],
        },
      ],
    });

    const text = response.text || "";

    return {
      text,
      data: response,
    };
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    throw new Error(error.message || "Failed to analyze image");
  }
};

/**
 * Analyze purchase order image
 * Extract relevant information for receiving process including lot details
 */
export const analyticPurchaseOrderImage = async (
  file: File,
): Promise<{
  text: string;
  products?: Array<{
    name: string;
    quantity?: number;
    lotNumber?: string;
    expirationDate?: string;
    lots?: Array<{
      lotNumber?: string;
      quantity?: number;
      expirationDate?: string;
    }>;
  }>;
  supplier?: string;
  data: any;
}> => {
  const prompt = `
Phân tích ảnh đơn hàng/phiếu nhập này và trích xuất thông tin sau (trả lời bằng tiếng Việt):

1. Tên nhà cung cấp (nếu có)
2. Danh sách sản phẩm trong ảnh với thông tin CHI TIẾT:
   - Tên sản phẩm
   - Số lượng
   - Số lô (Lot Number, Batch Number) - RẤT QUAN TRỌNG
   - Hạn sử dụng (Expiry Date, EXP, HSD) theo format YYYY-MM-DD - RẤT QUAN TRỌNG
   - Mã SKU hoặc barcode (nếu có)

   Nếu có NHIỀU LÔ cho cùng 1 sản phẩm, vui lòng liệt kê từng lô riêng biệt.

3. Mô tả về tình trạng bao bì/sản phẩm

LƯU Ý: Số lô và hạn sử dụng rất quan trọng cho việc quản lý kho. Hãy cố gắng tìm và trích xuất thông tin này.

Trả lời theo format JSON với cấu trúc:
{
  "nha_cung_cap": "Tên NCC",
  "san_pham": [
    {
      "ten": "Tên sản phẩm",
      "so_luong": 10,
      "so_lo": "LOT123",
      "han_su_dung": "2025-12-31",
      "ma_sku": "SKU123",
      "cac_lo": [
        {
          "so_lo": "LOT123",
          "so_luong": 5,
          "han_su_dung": "2025-12-31"
        },
        {
          "so_lo": "LOT124",
          "so_luong": 5,
          "han_su_dung": "2026-01-15"
        }
      ]
    }
  ]
}
  `.trim();

  const result = await analyticImageFromFile(file, prompt);

  // Try to extract structured data
  let products: Array<{
    name: string;
    quantity?: number;
    lotNumber?: string;
    expirationDate?: string;
    lots?: Array<{
      lotNumber?: string;
      quantity?: number;
      expirationDate?: string;
    }>;
  }> = [];
  let supplier: string | undefined;

  try {
    // Try to parse if response is JSON
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const productList = parsed.san_pham || parsed.products || [];

      products = productList.map((p: any) => ({
        name: p.ten || p.name || "",
        quantity: p.so_luong || p.quantity,
        lotNumber: p.so_lo || p.lot_number || p.lotNumber,
        expirationDate: p.han_su_dung || p.expiration_date || p.expirationDate,
        lots: (p.cac_lo || p.lots || []).map((lot: any) => ({
          lotNumber: lot.so_lo || lot.lot_number || lot.lotNumber,
          quantity: lot.so_luong || lot.quantity,
          expirationDate:
            lot.han_su_dung || lot.expiration_date || lot.expirationDate,
        })),
      }));

      supplier = parsed.nha_cung_cap || parsed.supplier;
    }
  } catch (e) {
    // If not JSON, keep as plain text
    console.log("Response is not JSON, keeping as plain text");
  }

  return {
    text: result.text,
    products,
    supplier,
    data: result.data,
  };
};

/**
 * Analyze PDF from File object (browser)
 * Convert File to base64 then analyze with Gemini
 */
export const analyticPdfFromFile = async (
  file: File,
  prompt?: string,
): Promise<{ text: string; data: any }> => {
  try {
    // Convert File to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:application/pdf;base64,...)
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Use inline data for PDF analysis
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type || "application/pdf",
              },
            },
            {
              text:
                prompt ||
                "Analyze this PDF document and provide detailed information about its contents.",
            },
          ],
        },
      ],
    });

    const text = response.text || "";

    return {
      text,
      data: response,
    };
  } catch (error: any) {
    console.error("Error analyzing PDF:", error);
    throw new Error(error.message || "Failed to analyze PDF");
  }
};

/**
 * Analyze purchase order PDF document
 * Extract relevant information including lot details
 */
export const analyticPurchaseOrderPdf = async (
  file: File,
): Promise<{
  text: string;
  products?: Array<{
    name: string;
    quantity?: number;
    unitPrice?: number;
    sku?: string;
    lotNumber?: string;
    expirationDate?: string;
    lots?: Array<{
      lotNumber?: string;
      quantity?: number;
      expirationDate?: string;
    }>;
  }>;
  supplier?: string;
  orderNumber?: string;
  orderDate?: string;
  totalAmount?: number;
  data: any;
}> => {
  const prompt = `
Phân tích tài liệu PDF đơn hàng/phiếu nhập này và trích xuất thông tin sau (trả lời bằng tiếng Việt):

1. Tên nhà cung cấp
2. Số đơn hàng
3. Ngày đặt hàng
4. Danh sách sản phẩm với thông tin CHI TIẾT:
   - Tên sản phẩm
   - Số lượng
   - Đơn giá
   - Mã SKU/Mã sản phẩm (nếu có)
   - Số lô (Lot Number, Batch Number) - RẤT QUAN TRỌNG
   - Hạn sử dụng (Expiry Date, EXP, HSD) theo format YYYY-MM-DD - RẤT QUAN TRỌNG

   Nếu có NHIỀU LÔ cho cùng 1 sản phẩm, vui lòng liệt kê từng lô riêng biệt.

5. Tổng giá trị đơn hàng
6. Các thông tin khác quan trọng (điều khoản thanh toán, thời gian giao hàng, v.v.)

LƯU Ý: Số lô và hạn sử dụng rất quan trọng cho việc quản lý kho. Hãy cố gắng tìm và trích xuất thông tin này.

Trả lời theo format JSON với cấu trúc sau:
{
  "nha_cung_cap": "Tên nhà cung cấp",
  "so_don_hang": "Số đơn hàng",
  "ngay_dat_hang": "YYYY-MM-DD",
  "san_pham": [
    {
      "ten": "Tên sản phẩm",
      "so_luong": 10,
      "don_gia": 50000,
      "ma_sku": "SKU123",
      "so_lo": "LOT123",
      "han_su_dung": "2025-12-31",
      "cac_lo": [
        {
          "so_lo": "LOT123",
          "so_luong": 5,
          "han_su_dung": "2025-12-31"
        },
        {
          "so_lo": "LOT124",
          "so_luong": 5,
          "han_su_dung": "2026-01-15"
        }
      ]
    }
  ],
  "tong_gia_tri": 500000,
  "thong_tin_khac": "Các thông tin bổ sung"
}
  `.trim();

  const result = await analyticPdfFromFile(file, prompt);

  // Try to extract structured data
  let products: Array<{
    name: string;
    quantity?: number;
    unitPrice?: number;
    sku?: string;
    lotNumber?: string;
    expirationDate?: string;
    lots?: Array<{
      lotNumber?: string;
      quantity?: number;
      expirationDate?: string;
    }>;
  }> = [];
  let supplier: string | undefined;
  let orderNumber: string | undefined;
  let orderDate: string | undefined;
  let totalAmount: number | undefined;

  try {
    // Try to parse if response is JSON
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      supplier = parsed.nha_cung_cap || parsed.supplier;
      orderNumber = parsed.so_don_hang || parsed.order_number;
      orderDate = parsed.ngay_dat_hang || parsed.order_date;
      totalAmount = parsed.tong_gia_tri || parsed.total_amount;

      // Map products
      const productList = parsed.san_pham || parsed.products || [];
      products = productList.map((p: any) => ({
        name: p.ten || p.name || "",
        quantity: p.so_luong || p.quantity,
        unitPrice: p.don_gia || p.unit_price || p.unitPrice,
        sku: p.ma_sku || p.sku || p.code,
        lotNumber: p.so_lo || p.lot_number || p.lotNumber,
        expirationDate: p.han_su_dung || p.expiration_date || p.expirationDate,
        lots: (p.cac_lo || p.lots || []).map((lot: any) => ({
          lotNumber: lot.so_lo || lot.lot_number || lot.lotNumber,
          quantity: lot.so_luong || lot.quantity,
          expirationDate:
            lot.han_su_dung || lot.expiration_date || lot.expirationDate,
        })),
      }));
    }
  } catch (e) {
    // If not JSON, keep as plain text
    console.log("Response is not JSON, keeping as plain text");
  }

  return {
    text: result.text,
    products,
    supplier,
    orderNumber,
    orderDate,
    totalAmount,
    data: result.data,
  };
};

/**
 * Analyze invoice PDF document
 * Extract invoice information including items, amounts, tax, etc.
 */
export const analyticInvoicePdf = async (
  file: File,
): Promise<{
  text: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  supplier?: string;
  customer?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  data: any;
}> => {
  const prompt = `
Phân tích hóa đơn PDF này và trích xuất thông tin sau (trả lời bằng tiếng Việt):

1. Số hóa đơn
2. Ngày hóa đơn
3. Nhà cung cấp/Người bán
4. Khách hàng/Người mua
5. Danh sách hàng hóa/dịch vụ:
   - Tên hàng hóa/dịch vụ
   - Số lượng
   - Đơn giá
   - Thành tiền
6. Tổng tiền trước thuế
7. Thuế VAT (số tiền)
8. Tổng cộng tiền thanh toán

Trả lời theo format JSON với cấu trúc sau:
{
  "so_hoa_don": "Số hóa đơn",
  "ngay_hoa_don": "YYYY-MM-DD",
  "nha_cung_cap": "Tên nhà cung cấp",
  "khach_hang": "Tên khách hàng",
  "hang_hoa": [
    {
      "ten": "Tên hàng hóa",
      "so_luong": 10,
      "don_gia": 50000,
      "thanh_tien": 500000
    }
  ],
  "tong_tien_truoc_thue": 500000,
  "thue_vat": 50000,
  "tong_thanh_toan": 550000
}
  `.trim();

  const result = await analyticPdfFromFile(file, prompt);

  // Try to extract structured data
  let invoiceNumber: string | undefined;
  let invoiceDate: string | undefined;
  let supplier: string | undefined;
  let customer: string | undefined;
  let items: Array<{
    name: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }> = [];
  let subtotal: number | undefined;
  let taxAmount: number | undefined;
  let totalAmount: number | undefined;

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      invoiceNumber = parsed.so_hoa_don || parsed.invoice_number;
      invoiceDate = parsed.ngay_hoa_don || parsed.invoice_date;
      supplier = parsed.nha_cung_cap || parsed.supplier;
      customer = parsed.khach_hang || parsed.customer;
      subtotal = parsed.tong_tien_truoc_thue || parsed.subtotal;
      taxAmount = parsed.thue_vat || parsed.tax_amount;
      totalAmount = parsed.tong_thanh_toan || parsed.total_amount;

      const itemList = parsed.hang_hoa || parsed.items || [];
      items = itemList.map((item: any) => ({
        name: item.ten || item.name || "",
        quantity: item.so_luong || item.quantity,
        unitPrice: item.don_gia || item.unit_price || item.unitPrice,
        totalPrice: item.thanh_tien || item.total_price || item.totalPrice,
      }));
    }
  } catch (e) {
    console.log("Response is not JSON, keeping as plain text");
  }

  return {
    text: result.text,
    invoiceNumber,
    invoiceDate,
    supplier,
    customer,
    items,
    subtotal,
    taxAmount,
    totalAmount,
    data: result.data,
  };
};
