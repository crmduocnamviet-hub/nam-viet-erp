// File: supabase/functions/scan-invoice-v2/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

// --- HÀM CHÍNH XỬ LÝ YÊU CẦU ---
serve(async (req) => {
  // 1. Khởi tạo các client cần thiết
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    }
  );
  const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") ?? "");
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  try {
    // 2. Lấy dữ liệu từ yêu cầu của người dùng
    const { poId, fileContent, mimeType } = await req.json();
    if (!poId || !fileContent || !mimeType) {
      throw new Error("Thiếu thông tin poId, fileContent, hoặc mimeType.");
    }

    // 3. Lấy thông tin các sản phẩm có trong Đơn đặt hàng gốc từ CSDL
    const { data: poItems, error: poError } = await supabaseClient
      .from("purchase_order_items")
      .select("quantity, products(id, name, sku, cost_price)")
      .eq("po_id", poId);

    if (poError) throw poError;

    // 4. Xây dựng một câu lệnh (prompt) chi tiết để "ra lệnh" cho AI
    const prompt = `
      Bạn là một trợ lý nhập liệu cho hệ thống ERP Dược phẩm. 
      Phân tích hình ảnh hóa đơn/PDF được cung cấp và trích xuất TOÀN BỘ các sản phẩm trong đó.
      Với mỗi sản phẩm, trả về các thông tin sau: Tên sản phẩm trên hóa đơn, Số lượng, Đơn giá.
      Đây là danh sách các sản phẩm có trong đơn đặt hàng gốc của tôi, hãy cố gắng đối chiếu và trả về product_id chính xác nếu có thể:
      ${JSON.stringify(
        poItems.map((p) => ({
          id: p.products.id,
          name: p.products.name,
          sku: p.products.sku,
        }))
      )}

      Chỉ trả lời bằng một đối tượng JSON duy nhất có cấu trúc như sau:
      {
        "items": [
          { "product_name_on_invoice": "Tên sản phẩm trên hóa đơn", "matched_product_id": 123 | null, "quantity": 100, "unit_price": 50000 },
          ...
        ]
      }
    `;

    // 5. Gửi yêu cầu đến Gemini Vision AI
    const imagePart = { inlineData: { data: fileContent, mimeType: mimeType } };
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const aiText = response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    const aiData = JSON.parse(aiText);

    // 6. Đối soát dữ liệu AI với đơn hàng gốc để tạo ra bảng kết quả cuối cùng
    const finalItems = [];
    const poItemsMap = new Map(poItems.map((item) => [item.products.id, item]));

    for (const aiItem of aiData.items) {
      const originalPoItem = poItemsMap.get(aiItem.matched_product_id);

      finalItems.push({
        key: aiItem.matched_product_id || aiItem.product_name_on_invoice,
        product_id: aiItem.matched_product_id,
        name: originalPoItem
          ? originalPoItem.products.name
          : aiItem.product_name_on_invoice,
        sku: originalPoItem ? originalPoItem.products.sku : "N/A",
        ordered_quantity: originalPoItem ? originalPoItem.quantity : 0,
        invoice_quantity: aiItem.quantity,
        received_quantity: aiItem.quantity,
        invoice_price: aiItem.unit_price,
        actual_price: aiItem.unit_price,
        lot_number: "", // Để trống cho người dùng nhập
        expiry_date: null,
        is_extra_item: !originalPoItem, // Đánh dấu là hàng ngoài đơn hàng nếu không tìm thấy trong đơn gốc
      });

      // Xóa sản phẩm đã được đối soát khỏi map
      if (originalPoItem) {
        poItemsMap.delete(aiItem.matched_product_id);
      }
    }

    // Thêm các sản phẩm có trong đơn gốc nhưng AI không tìm thấy trên hóa đơn (hàng bị thiếu)
    for (const missingItem of poItemsMap.values()) {
      finalItems.push({
        key: missingItem.products.id,
        product_id: missingItem.products.id,
        name: missingItem.products.name,
        sku: missingItem.products.sku,
        ordered_quantity: missingItem.quantity,
        invoice_quantity: 0, // AI không tìm thấy
        received_quantity: 0,
        invoice_price: missingItem.products.cost_price,
        actual_price: missingItem.products.cost_price,
        lot_number: "",
        expiry_date: null,
        is_extra_item: false,
      });
    }

    // 7. Trả kết quả đã đối soát về cho giao diện
    return new Response(JSON.stringify({ items: finalItems }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
