import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
  GEMINI_API_KEY;

// "Bản mô tả công việc" chi tiết chúng ta giao cho AI
const PROMPT_TEMPLATE = `
Bạn là một chuyên gia về dữ liệu dược phẩm tại Việt Nam, với hơn 20 năm kinh nghiệm trong lĩnh vực này, bạn đã tiếp xúc với hàng triệu hộp thuốc và các file thông tin chi tiết của sản phẩm.
Dựa vào tên sản phẩm được cung cấp, hãy trả về một đối tượng JSON DUY NHẤT, không có bất kỳ văn bản giải thích nào khác.
Đối tượng JSON phải có cấu trúc sau: { "description": string, "tags": string[], "category": string }.

- "description": Một đoạn mô tả ngắn gọn, hấp dẫn về sản phẩm (khoảng 50-70 từ), tập trung vào công dụng chính.
- "tags": Một mảng các chuỗi (string array) chứa các hoạt chất chính và các từ khóa liên quan (ví dụ: "paracetamol", "caffeine", "giảm đau", "hạ sốt").
- "category": Phân loại chính của sản phẩm (ví dụ: "Thuốc giảm đau, hạ sốt", "Vitamin và khoáng chất", "Thuốc kháng sinh").

Tên sản phẩm: "{PRODUCT_NAME}"
`;

serve(async (req) => {
  // Cho phép ứng dụng React gọi đến
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { productName } = await req.json();
    if (!productName) {
      throw new Error("Tên sản phẩm là bắt buộc.");
    }

    const prompt = PROMPT_TEMPLATE.replace("{PRODUCT_NAME}", productName);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    // Trích xuất nội dung JSON từ phản hồi của AI
    const aiResponseText = responseData.candidates[0].content.parts[0].text;
    const aiJson = JSON.parse(aiResponseText);

    return new Response(JSON.stringify(aiJson), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
