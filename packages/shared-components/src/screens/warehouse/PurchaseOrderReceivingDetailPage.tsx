import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  InputNumber,
  Modal,
  Alert,
  notification,
  Badge,
  Spin,
} from "antd";
import {
  ScanOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BarcodeOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  HomeOutlined,
  InboxOutlined,
  CameraOutlined,
  PictureOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import PageLayout from "../../components/PageLayout";
import LotExpirationInput from "../../components/LotExpirationInput";
import QRScannerModal from "../../components/QRScannerModal";
import { useAuthStore, usePurchaseOrderStore } from "@nam-viet-erp/store";
import {
  analyzeProductsNeedingReorder,
  createPurchaseOrdersFromProducts,
  analyticPurchaseOrderImage,
  analyticPurchaseOrderPdf,
} from "@nam-viet-erp/services";

const { Text } = Typography;

interface LotData {
  id: number; // Unique ID for UI management
  quantityToReceive: number;
  lotNumber?: string;
  expirationDate?: string;
  shelfLocation?: string;
  // Note: Removed pricing fields (unitPrice, vatPercent, promotion, discount)
  // Warehouse staff only need to check quantity, lot number, and expiration date
}

// Removed calculateFinalCostPrice - warehouse staff don't need pricing calculations

const PurchaseOrderReceivingDetailPage: React.FC = () => {
  const { poId } = useParams<{ poId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Purchase Order Store
  const {
    purchaseOrders,
    isLoading: loading,
    fetchPurchaseOrders,
    receivePurchaseOrderItems: receivePOItems,
  } = usePurchaseOrderStore();

  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [receivingData, setReceivingData] = useState<Record<number, LotData[]>>(
    {},
  );
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imageAnalysisResults, setImageAnalysisResults] = useState<
    Array<{
      fileName: string;
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
      analyzing: boolean;
      error?: string;
    }>
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // PDF Analysis States
  const [selectedPdfs, setSelectedPdfs] = useState<File[]>([]);
  const [pdfAnalysisResults, setPdfAnalysisResults] = useState<
    Array<{
      fileName: string;
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
      analyzing: boolean;
      error?: string;
    }>
  >([]);
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);

  // Fetch purchase orders on mount
  useEffect(() => {
    fetchPurchaseOrders({
      status: ["ordered", "sent", "partially_received"],
    });
  }, [fetchPurchaseOrders]);

  // Find and set the selected PO when data is loaded
  useEffect(() => {
    if (poId && purchaseOrders.length > 0) {
      const po = purchaseOrders.find((order) => order.id === Number(poId));
      if (po) {
        setSelectedPO(po);
      } else {
        notification.error({
          message: "Không tìm thấy",
          description: "Không tìm thấy đơn hàng này",
        });
        navigate("/warehouse/receiving");
      }
    }
  }, [poId, purchaseOrders, navigate]);

  // Calculate receiving summary
  const receivingSummary = React.useMemo(() => {
    if (!selectedPO) return null;

    const items = selectedPO.items || [];
    const totalItems = items.length;
    const totalQuantityOrdered = items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    );
    const totalQuantityReceived = items.reduce(
      (sum: number, item: any) => sum + (item.received_quantity || 0),
      0,
    );

    let totalQuantityToReceive = 0;
    let itemsWithData = 0;

    Object.values(receivingData).forEach((lots) => {
      if (lots.length > 0) {
        itemsWithData++;
        lots.forEach((lot) => {
          totalQuantityToReceive += lot.quantityToReceive || 0;
        });
      }
    });

    return {
      totalItems,
      totalQuantityOrdered,
      totalQuantityReceived,
      totalQuantityToReceive,
      itemsWithData,
      pendingQuantity: totalQuantityOrdered - totalQuantityReceived,
    };
  }, [selectedPO, receivingData]);

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    if (!selectedPO) return;

    // Find product by barcode in current PO items
    const item = selectedPO.items?.find(
      (item: any) =>
        item.product?.barcode === barcode ||
        item.product?.sku === barcode ||
        item.product?.id?.toString() === barcode,
    );

    if (item) {
      const remaining = item.quantity - (item.received_quantity || 0);
      if (remaining > 0) {
        setReceivingData((prev) => {
          const lots = prev[item.id] || [];
          const existingEmptyLotIndex = lots.findIndex((l) => !l.lotNumber);

          if (existingEmptyLotIndex !== -1) {
            const newLots = [...lots];
            newLots[existingEmptyLotIndex].quantityToReceive += 1;
            return { ...prev, [item.id]: newLots };
          } else {
            const newLot: LotData = {
              id: Date.now(),
              quantityToReceive: 1,
              lotNumber: "",
              expirationDate: "",
            };
            return { ...prev, [item.id]: [...lots, newLot] };
          }
        });

        notification.success({
          message: "Quét thành công",
          description: `${item.product?.name} - Thêm 1 sản phẩm`,
          duration: 2,
        });
      } else {
        notification.warning({
          message: "Đã nhận đủ",
          description: `${item.product?.name} đã nhận đủ số lượng`,
        });
      }
    } else {
      notification.error({
        message: "Không tìm thấy",
        description: "Sản phẩm không có trong đơn đặt hàng này",
      });
    }
  };

  // Handle confirm receiving
  const handleConfirmReceiving = () => {
    const itemsToReceive = Object.entries(receivingData).flatMap(
      ([itemId, lots]) => lots.map((lot) => ({ ...lot, itemId })),
    );

    if (itemsToReceive.length === 0) {
      notification.warning({
        message: "Chưa có sản phẩm",
        description: "Vui lòng nhập số lượng cần nhận cho ít nhất 1 sản phẩm",
      });
      return;
    }

    // Check for missing lot/expiration
    const missingData = itemsToReceive.filter(
      (lot) => !lot.lotNumber || !lot.expirationDate,
    );

    if (missingData.length > 0) {
      Modal.confirm({
        title: "Thiếu thông tin Lô/Hạn",
        content: `Có ${missingData.length} sản phẩm chưa nhập đủ Số Lô và Hạn Sử Dụng. Bạn có muốn tiếp tục?`,
        okText: "Tiếp tục",
        cancelText: "Hủy",
        onOk: () => confirmReceiving(),
      });
    } else {
      confirmReceiving();
    }
  };

  // Analyze a single image with Gemini AI
  const analyzeImage = async (file: File, index: number) => {
    try {
      // Add placeholder for this image
      setImageAnalysisResults((prev) => {
        const newResults = [...prev];
        newResults[index] = {
          fileName: file.name,
          text: "",
          analyzing: true,
        };
        return newResults;
      });

      // Analyze with Gemini AI
      const result = await analyticPurchaseOrderImage(file);

      // Update with results
      setImageAnalysisResults((prev) => {
        const newResults = [...prev];
        newResults[index] = {
          fileName: file.name,
          text: result.text,
          products: result.products,
          supplier: result.supplier,
          analyzing: false,
        };
        return newResults;
      });

      console.log(`✅ Analyzed ${file.name}:`, result);
    } catch (error: any) {
      console.error(`❌ Error analyzing ${file.name}:`, error);
      setImageAnalysisResults((prev) => {
        const newResults = [...prev];
        newResults[index] = {
          fileName: file.name,
          text: "",
          analyzing: false,
          error: error.message || "Không thể phân tích ảnh",
        };
        return newResults;
      });
    }
  };

  // Handle image selection
  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const startIndex = selectedImages.length;
    setSelectedImages((prev) => [...prev, ...newFiles]);

    // Create preview URLs
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);

    // Log file paths/names for debugging
    newFiles.forEach((file) => {
      console.log("Selected image:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
      });
    });

    notification.success({
      message: "Đã chọn ảnh",
      description: `Đã chọn ${newFiles.length} ảnh. Đang phân tích với AI...`,
    });

    // Analyze each image with Gemini AI
    setIsAnalyzing(true);
    for (let i = 0; i < newFiles.length; i++) {
      await analyzeImage(newFiles[i], startIndex + i);
    }
    setIsAnalyzing(false);

    notification.success({
      message: "Phân tích hoàn tất",
      description: `Đã phân tích ${newFiles.length} ảnh với Gemini AI`,
    });

    // Reset input to allow selecting the same file again
    event.target.value = "";
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    // Revoke URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
    // Remove corresponding analysis result
    setImageAnalysisResults((prev) => prev.filter((_, i) => i !== index));
  };

  // Get image information for upload or processing
  const getImageInfo = () => {
    return selectedImages.map((file, index) => ({
      file: file, // File object - use this to upload
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      previewUrl: imagePreviewUrls[index],
      // Note: Browser không cho phép lấy absolute path vì lý do bảo mật
      // Thay vào đó, sử dụng File object để upload trực tiếp
      relativePath: (file as any).webkitRelativePath || file.name,
    }));
  };

  // Convert file to Base64 (alternative upload method)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Get all images as Base64 (for upload to server)
  const getImagesAsBase64 = async () => {
    try {
      const base64Images = await Promise.all(
        selectedImages.map(async (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          base64: await fileToBase64(file),
        })),
      );
      return base64Images;
    } catch (error) {
      console.error("Error converting images to base64:", error);
      return [];
    }
  };

  // Prepare FormData for upload (recommended method)
  const prepareFormDataForUpload = () => {
    const formData = new FormData();

    // Add PO ID
    if (selectedPO) {
      formData.append("po_id", selectedPO.id.toString());
    }

    // Add all image files
    selectedImages.forEach((file, index) => {
      formData.append(`images`, file); // Server will receive as array
      // Or use unique names:
      // formData.append(`image_${index}`, file);
    });

    // Add metadata if needed
    formData.append(
      "metadata",
      JSON.stringify({
        uploadedAt: new Date().toISOString(),
        totalFiles: selectedImages.length,
        poNumber: selectedPO?.po_number,
      }),
    );

    return formData;
  };

  // Example: Upload to server/Supabase
  const uploadImages = async () => {
    if (selectedImages.length === 0) {
      notification.warning({
        message: "Không có ảnh",
        description: "Vui lòng chọn ảnh trước khi upload",
      });
      return;
    }

    try {
      // Method 1: Upload với FormData (recommended)
      const formData = prepareFormDataForUpload();

      console.log("=== FormData prepared for upload ===");
      console.log("Total files:", selectedImages.length);

      // TODO: Implement actual upload
      // Example with fetch:
      // const response = await fetch('/api/upload-po-images', {
      //   method: 'POST',
      //   body: formData,
      // });

      // Example with Supabase Storage:
      // const { uploadMultiplePurchaseOrderImages } = await import('@nam-viet-erp/services');
      // const results = await uploadMultiplePurchaseOrderImages(selectedPO.id, selectedImages);

      notification.success({
        message: "Chuẩn bị upload",
        description: `Đã chuẩn bị ${selectedImages.length} ảnh để upload`,
      });

      // Method 2: Upload as Base64 (alternative)
      // const base64Images = await getImagesAsBase64();
      // console.log('Base64 images:', base64Images);

      return formData;
    } catch (error: any) {
      notification.error({
        message: "Lỗi upload",
        description: error.message,
      });
    }
  };

  // Example: Log all image info to console
  const logImagePaths = () => {
    const images = getImageInfo();
    console.log("=== Selected Images Info ===");
    console.log(
      "⚠️ LƯU Ý: Browser không cho phép lấy absolute path vì lý do bảo mật",
    );
    console.log("➡️ Sử dụng File object để upload trực tiếp");
    console.log("");

    images.forEach((img, idx) => {
      console.log(`Image ${idx + 1}:`, {
        fileName: img.name,
        fileSize: `${(img.size / 1024).toFixed(2)} KB`,
        fileType: img.type,
        lastModified: new Date(img.lastModified).toLocaleString("vi-VN"),
        previewUrl: img.previewUrl,
        relativePath: img.relativePath,
        fileObject: img.file, // ← Use this to upload
      });
    });

    console.log("");
    console.log("=== Total Images:", images.length);
    console.log("=== Cách upload: ===");
    console.log("1. Sử dụng FormData (recommended):");
    console.log("   const formData = prepareFormDataForUpload();");
    console.log(
      "   await fetch('/api/upload', { method: 'POST', body: formData });",
    );
    console.log("");
    console.log("2. Hoặc convert sang Base64:");
    console.log("   const base64Images = await getImagesAsBase64();");

    return images;
  };

  // ==================== PDF Analysis Handlers ====================

  // Analyze a single PDF with Gemini AI
  const analyzePdf = async (file: File, index: number) => {
    try {
      // Add placeholder for this PDF
      setPdfAnalysisResults((prev) => {
        const newResults = [...prev];
        newResults[index] = {
          fileName: file.name,
          text: "",
          analyzing: true,
        };
        return newResults;
      });

      // Analyze with Gemini AI
      const result = await analyticPurchaseOrderPdf(file);

      // Update with results
      setPdfAnalysisResults((prev) => {
        const newResults = [...prev];
        newResults[index] = {
          fileName: file.name,
          text: result.text,
          products: result.products,
          supplier: result.supplier,
          orderNumber: result.orderNumber,
          orderDate: result.orderDate,
          totalAmount: result.totalAmount,
          analyzing: false,
        };
        return newResults;
      });

      console.log(`✅ Analyzed PDF ${file.name}:`, result);

      // Show detailed notification
      if (result.supplier || result.orderNumber) {
        notification.success({
          message: "Phân tích PDF hoàn tất",
          description: `${file.name}: ${result.supplier || "N/A"} - ${result.orderNumber || "N/A"}`,
          duration: 5,
        });
      }
    } catch (error: any) {
      console.error(`❌ Error analyzing PDF ${file.name}:`, error);
      setPdfAnalysisResults((prev) => {
        const newResults = [...prev];
        newResults[index] = {
          fileName: file.name,
          text: "",
          analyzing: false,
          error: error.message || "Không thể phân tích PDF",
        };
        return newResults;
      });

      notification.error({
        message: "Lỗi phân tích PDF",
        description: `${file.name}: ${error.message}`,
      });
    }
  };

  // Handle PDF selection
  const handlePdfSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const startIndex = selectedPdfs.length;

    // Validate file types and sizes
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const invalidFiles = newFiles.filter(
      (file) => file.type !== "application/pdf" || file.size > MAX_FILE_SIZE,
    );

    if (invalidFiles.length > 0) {
      notification.error({
        message: "File không hợp lệ",
        description: `Vui lòng chọn file PDF nhỏ hơn 20MB. ${invalidFiles.length} file bị loại bỏ.`,
      });
      return;
    }

    setSelectedPdfs((prev) => [...prev, ...newFiles]);

    // Log file info for debugging
    newFiles.forEach((file) => {
      console.log("Selected PDF:", {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
      });
    });

    notification.success({
      message: "Đã chọn PDF",
      description: `Đã chọn ${newFiles.length} file PDF. Đang phân tích với AI...`,
    });

    // Analyze each PDF with Gemini AI
    setIsAnalyzingPdf(true);
    for (let i = 0; i < newFiles.length; i++) {
      await analyzePdf(newFiles[i], startIndex + i);
    }
    setIsAnalyzingPdf(false);

    notification.success({
      message: "Phân tích PDF hoàn tất",
      description: `Đã phân tích ${newFiles.length} file PDF với Gemini AI`,
    });

    // Reset input to allow selecting the same file again
    event.target.value = "";
  };

  // Remove PDF
  const handleRemovePdf = (index: number) => {
    setSelectedPdfs((prev) => prev.filter((_, i) => i !== index));
    setPdfAnalysisResults((prev) => prev.filter((_, i) => i !== index));
  };

  // ==================== Auto-fill from AI Analysis ====================

  // Calculate string similarity (Levenshtein distance based)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1.0;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Levenshtein distance
    const matrix: number[][] = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    const distance = matrix[s1.length][s2.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - distance / maxLength;
  };

  // Match and fill receiving data from AI analysis
  const matchAndFillFromAnalysis = () => {
    if (!selectedPO || !selectedPO.items) {
      notification.warning({
        message: "Không có đơn hàng",
        description: "Không tìm thấy đơn hàng để đối chiếu",
      });
      return;
    }

    // Collect all products from AI analysis (both images and PDFs)
    const allAnalyzedProducts: Array<{
      name: string;
      quantity?: number;
      unitPrice?: number;
      lotNumber?: string;
      expirationDate?: string;
      lots?: Array<{
        lotNumber?: string;
        quantity?: number;
        expirationDate?: string;
      }>;
      source: string;
    }> = [];

    // From image analysis
    imageAnalysisResults.forEach((result) => {
      if (result.products && !result.error) {
        result.products.forEach((product) => {
          allAnalyzedProducts.push({
            name: product.name,
            quantity: product.quantity,
            lotNumber: product.lotNumber,
            expirationDate: product.expirationDate,
            lots: product.lots,
            source: `Ảnh: ${result.fileName}`,
          });
        });
      }
    });

    // From PDF analysis
    pdfAnalysisResults.forEach((result) => {
      if (result.products && !result.error) {
        result.products.forEach((product) => {
          allAnalyzedProducts.push({
            name: product.name,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            lotNumber: product.lotNumber,
            expirationDate: product.expirationDate,
            lots: product.lots,
            source: `PDF: ${result.fileName}`,
          });
        });
      }
    });

    if (allAnalyzedProducts.length === 0) {
      notification.warning({
        message: "Không có sản phẩm",
        description: "Không tìm thấy sản phẩm nào trong kết quả phân tích AI",
      });
      return;
    }

    // Match products
    const matches: Array<{
      poItem: any;
      analyzedProduct: any;
      similarity: number;
    }> = [];

    const SIMILARITY_THRESHOLD = 0.6; // 60% similarity required

    selectedPO.items.forEach((poItem: any) => {
      const poProductName = poItem.product_name || poItem.products?.name || "";

      allAnalyzedProducts.forEach((analyzedProduct) => {
        const similarity = calculateSimilarity(
          poProductName,
          analyzedProduct.name,
        );

        if (similarity >= SIMILARITY_THRESHOLD) {
          matches.push({
            poItem,
            analyzedProduct,
            similarity,
          });
        }
      });
    });

    // Sort by similarity (best matches first)
    matches.sort((a, b) => b.similarity - a.similarity);

    // Remove duplicate matches (keep best match for each PO item)
    const uniqueMatches = matches.reduce(
      (acc, match) => {
        const existing = acc.find((m) => m.poItem.id === match.poItem.id);
        if (!existing || match.similarity > existing.similarity) {
          return [...acc.filter((m) => m.poItem.id !== match.poItem.id), match];
        }
        return acc;
      },
      [] as typeof matches,
    );

    if (uniqueMatches.length === 0) {
      notification.warning({
        message: "Không tìm thấy khớp",
        description: `Không tìm thấy sản phẩm nào khớp với ngưỡng ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%`,
      });
      return;
    }

    // Apply matches to receiving data
    const newReceivingData = { ...receivingData };
    let appliedCount = 0;
    let appliedLotCount = 0;

    uniqueMatches.forEach((match) => {
      const productId = match.poItem.product_id;
      const analyzedProduct = match.analyzedProduct;
      const existingLots = newReceivingData[productId] || [];

      // Case 1: Product has multiple lots defined
      if (analyzedProduct.lots && analyzedProduct.lots.length > 0) {
        const newLots: LotData[] = [];

        analyzedProduct.lots.forEach((lot: any, idx: number) => {
          if (lot.quantity && lot.quantity > 0) {
            newLots.push({
              id: Date.now() + Math.random() + idx,
              quantityToReceive: lot.quantity,
              lotNumber: lot.lotNumber,
              expirationDate: lot.expirationDate,
            });
            appliedLotCount++;
          }
        });

        if (newLots.length > 0) {
          // Append to existing lots
          newReceivingData[productId] = [...existingLots, ...newLots];
          appliedCount++;
        }
      }
      // Case 2: Product has single lot info (lotNumber or expirationDate)
      else if (
        analyzedProduct.lotNumber ||
        analyzedProduct.expirationDate ||
        (analyzedProduct.quantity && analyzedProduct.quantity > 0)
      ) {
        const quantity = analyzedProduct.quantity || 0;

        if (
          quantity > 0 ||
          analyzedProduct.lotNumber ||
          analyzedProduct.expirationDate
        ) {
          // Create new lot with only quantity, lot number, and expiration date
          const newLot: LotData = {
            id: Date.now() + Math.random(),
            quantityToReceive: quantity,
            lotNumber: analyzedProduct.lotNumber,
            expirationDate: analyzedProduct.expirationDate,
          };

          // Check if we should update existing or add new
          if (existingLots.length === 0) {
            newReceivingData[productId] = [newLot];
            appliedCount++;
            appliedLotCount++;
          } else {
            // Check if first lot is empty
            const firstLot = existingLots[0];
            if (
              !firstLot.quantityToReceive ||
              firstLot.quantityToReceive === 0
            ) {
              // Update first lot - only quantity, lot number, and expiration date
              firstLot.quantityToReceive = quantity;
              firstLot.lotNumber =
                analyzedProduct.lotNumber || firstLot.lotNumber;
              firstLot.expirationDate =
                analyzedProduct.expirationDate || firstLot.expirationDate;
              appliedCount++;
              appliedLotCount++;
            } else {
              // Add as new lot
              newReceivingData[productId] = [...existingLots, newLot];
              appliedCount++;
              appliedLotCount++;
            }
          }
        }
      }
    });

    setReceivingData(newReceivingData);

    // Show detailed results
    Modal.success({
      title: "Đối chiếu hoàn tất",
      width: 800,
      content: (
        <div>
          <p>
            <strong>Đã áp dụng {appliedCount} sản phẩm</strong> (
            {appliedLotCount} lô) từ kết quả phân tích AI
          </p>
          <Table
            size="small"
            dataSource={uniqueMatches}
            pagination={false}
            columns={[
              {
                title: "Sản phẩm trong đơn",
                dataIndex: ["poItem", "product_name"],
                key: "po_product",
                ellipsis: true,
                width: 200,
              },
              {
                title: "Phát hiện từ AI",
                dataIndex: ["analyzedProduct", "name"],
                key: "analyzed_product",
                ellipsis: true,
                width: 200,
              },
              {
                title: "SL",
                dataIndex: ["analyzedProduct", "quantity"],
                key: "quantity",
                width: 60,
                render: (qty) => qty || 0,
              },
              {
                title: "Số lô",
                dataIndex: ["analyzedProduct", "lotNumber"],
                key: "lotNumber",
                width: 100,
                render: (lot) => (lot ? <Tag color="purple">{lot}</Tag> : "-"),
              },
              {
                title: "HSD",
                dataIndex: ["analyzedProduct", "expirationDate"],
                key: "expirationDate",
                width: 100,
                render: (date) => date || "-",
              },
              {
                title: "Độ khớp",
                dataIndex: "similarity",
                key: "similarity",
                width: 80,
                render: (sim) => (
                  <Tag
                    color={
                      sim >= 0.9 ? "green" : sim >= 0.7 ? "blue" : "orange"
                    }
                  >
                    {(sim * 100).toFixed(0)}%
                  </Tag>
                ),
              },
            ]}
            style={{ marginTop: 16 }}
          />
        </div>
      ),
    });

    notification.success({
      message: "Đối chiếu thành công",
      description: `Đã điền ${appliedLotCount} lô cho ${appliedCount} sản phẩm từ AI`,
      duration: 5,
    });
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Run auto-generate purchase orders
  const runAutoGenerate = async () => {
    try {
      const warehouseId = 1; // TODO: Get actual warehouseId from context/props
      const autoGenResult = await analyzeProductsNeedingReorder(warehouseId);

      if (
        autoGenResult.productsToOrder &&
        autoGenResult.productsToOrder.length > 0
      ) {
        const createResult = await createPurchaseOrdersFromProducts(
          autoGenResult.productsToOrder,
          warehouseId,
          user?.id || null,
        );

        notification.success({
          message: "Dự trù tự động hoàn tất",
          description:
            createResult.message ||
            `Đã tạo đơn đặt hàng tự động cho ${autoGenResult.productsToOrder.length} sản phẩm`,
          duration: 5,
        });
      } else {
        notification.info({
          message: "Dự trù tự động",
          description: "Không có sản phẩm nào cần đặt hàng",
          duration: 3,
        });
      }
    } catch (autoGenError: any) {
      // Don't block the main flow if auto-generate fails
      console.error("Auto-generate error:", autoGenError);
      notification.warning({
        message: "Dự trù tự động thất bại",
        description:
          autoGenError.message || "Không thể tạo đơn đặt hàng tự động",
        duration: 4,
      });
    }
  };

  const confirmReceiving = async () => {
    setConfirming(true);
    try {
      // Prepare receiving payload
      const receivingPayload = Object.entries(receivingData)
        .flatMap(([itemId, lots]) =>
          lots.map((lot) => ({
            itemId: Number(itemId),
            quantityToReceive: lot.quantityToReceive,
            lotNumber: lot.lotNumber,
            expirationDate: lot.expirationDate,
            shelfLocation: lot.shelfLocation,
            // Removed pricing data - warehouse staff only need quantity, lot, expiration
          })),
        )
        .filter((lot) => lot.quantityToReceive > 0);

      console.log(receivingData);

      // Call receiving service through store
      const result = await receivePOItems(
        selectedPO.id,
        receivingPayload,
        user?.id || null,
      );

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to receive items");
      }

      notification.success({
        message: "Nhận hàng thành công",
        description: `Đã nhận ${receivingSummary?.itemsWithData} sản phẩm với tổng ${receivingSummary?.totalQuantityToReceive} chiếc`,
        duration: 4,
      });

      // Check if this is a partial receive
      const isPartialReceive =
        receivingSummary!.totalQuantityToReceive <
        receivingSummary!.pendingQuantity;

      if (isPartialReceive) {
        // Show confirmation modal for partial receive
        Modal.confirm({
          title: "Đơn hàng nhận một phần",
          content:
            "Đơn hàng chưa nhận đủ số lượng. Bạn có muốn chạy 'Dự trù tự động' để tạo đơn hàng mới không?",
          okText: "Chạy Dự Trù",
          cancelText: "Bỏ qua",
          onOk: async () => {
            await runAutoGenerate();
            // Navigate back after auto-generate completes
            setReceivingData({});
            navigate("/warehouse/receiving");
          },
          onCancel: () => {
            // Navigate back even if user cancels
            setReceivingData({});
            navigate("/warehouse/receiving");
          },
        });
      } else {
        // Full receive - run auto-generate automatically
        await runAutoGenerate();

        // Reset and navigate back
        setReceivingData({});
        navigate("/warehouse/receiving");
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể xác nhận nhận hàng",
      });
    } finally {
      setConfirming(false);
    }
  };

  // Product columns
  const productColumns: ColumnsType<any> = [
    {
      title: "Sản Phẩm",
      dataIndex: ["product", "name"],
      key: "product_name",
      width: 200,
      fixed: "left",
    },
    {
      title: "Mã",
      dataIndex: ["product", "sku"],
      key: "sku",
      width: 100,
    },
    {
      title: "SL Đặt",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      align: "center",
    },
    {
      title: "Đã Nhận",
      dataIndex: "received_quantity",
      key: "received_quantity",
      width: 90,
      align: "center",
      render: (qty: number) => <Tag color="success">{qty || 0}</Tag>,
    },
    {
      title: "Còn Lại",
      key: "remaining",
      width: 80,
      align: "center",
      render: (_: any, record: any) => {
        const remaining = record.quantity - (record.received_quantity || 0);
        return (
          <Tag color={remaining > 0 ? "warning" : "default"}>{remaining}</Tag>
        );
      },
    },
    {
      title: "Nhận Lần Này",
      key: "receiving",
      width: 120,
      align: "center",
      render: (_: any, record: any) => {
        const lots = receivingData[record.id] || [];
        const totalToReceive = lots.reduce(
          (sum, lot) => sum + (lot.quantityToReceive || 0),
          0,
        );
        return <Text strong>{totalToReceive}</Text>;
      },
    },
    {
      title: "Số Lô & Hạn SD",
      key: "lot_expiration",
      width: 350,
      render: (_: any, record: any) => {
        const lots = receivingData[record.id] || [];
        const product = record.product;
        const showLotInput = product?.enable_lot_management;

        return (
          <Space direction="vertical" style={{ width: "100%" }}>
            {lots.map((lot, index) => (
              <Space key={lot.id} style={{ width: "100%" }} align="start">
                <LotExpirationInput
                  showLotNumberInput={showLotInput}
                  value={{
                    lotNumber: lot.lotNumber,
                    expirationDate: lot.expirationDate,
                  }}
                  onChange={(value) => {
                    const newLots = [...lots];
                    newLots[index] = { ...newLots[index], ...value };
                    setReceivingData((prev) => ({
                      ...prev,
                      [record.id]: newLots,
                    }));
                  }}
                  productId={record.product_id}
                />
                <InputNumber
                  min={1}
                  placeholder="SL"
                  value={lot.quantityToReceive}
                  onChange={(quantity) => {
                    const newLots = [...lots];
                    newLots[index].quantityToReceive = quantity || 1;
                    setReceivingData((prev) => ({
                      ...prev,
                      [record.id]: newLots,
                    }));
                  }}
                  style={{ width: 70 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const newLots = lots.filter((_, i) => i !== index);
                    setReceivingData((prev) => ({
                      ...prev,
                      [record.id]: newLots,
                    }));
                  }}
                />
              </Space>
            ))}
            {(!!product?.enable_lot_management || lots.length === 0) && (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => {
                  const newLot: LotData = {
                    id: Date.now(),
                    quantityToReceive: 1,
                    lotNumber: "",
                    expirationDate: "",
                  };
                  setReceivingData((prev) => ({
                    ...prev,
                    [record.id]: [...(prev[record.id] || []), newLot],
                  }));
                }}
                block
              >
                Thêm Lô
              </Button>
            )}
          </Space>
        );
      },
    },
    // Removed: Giá gốc (chưa VAT), VAT (%), Khuyến mại, CK trả sau, Giá vốn cuối
    // Warehouse staff only need to check quantity, lot number, and expiration date
    {
      title: "Trạng Thái",
      key: "status",
      width: 120,
      fixed: "right",
      render: (_: any, record: any) => {
        const lots = receivingData[record.id] || [];
        const totalToReceive = lots.reduce(
          (sum, lot) => sum + (lot.quantityToReceive || 0),
          0,
        );

        if (totalToReceive === 0) {
          return <Tag>Chưa nhận</Tag>;
        }
        const remaining = record.quantity - (record.received_quantity || 0);
        if (totalToReceive === remaining) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Đủ
            </Tag>
          );
        }
        return (
          <Tag color="warning" icon={<WarningOutlined />}>
            Một phần
          </Tag>
        );
      },
    },
  ];

  if (loading || !selectedPO) {
    return (
      <PageLayout title="Xác Nhận Nhận Hàng">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Xác Nhận Nhận Hàng"
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Nhận Hàng",
          href: "/warehouse/receiving",
          icon: <InboxOutlined />,
        },
        {
          title: "Xác Nhận Nhận Hàng",
        },
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Order Info */}
        <Card>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Số Đơn"
                value={selectedPO.po_number}
                prefix={<Text type="secondary">#</Text>}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Nhà Cung Cấp"
                value={selectedPO.supplier?.name || "-"}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Tổng SL Đặt"
                value={receivingSummary?.totalQuantityOrdered || 0}
                suffix="sp"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Đã Nhận"
                value={receivingSummary?.totalQuantityReceived || 0}
                valueStyle={{ color: "#52c41a" }}
                suffix="sp"
              />
            </Col>
          </Row>
        </Card>

        {/* Receiving Summary Alert */}
        {receivingSummary && receivingSummary.totalQuantityToReceive > 0 && (
          <Alert
            message={
              <Space>
                <Text strong>Chuẩn bị nhận:</Text>
                <Badge
                  count={receivingSummary.itemsWithData}
                  style={{ backgroundColor: "#1890ff" }}
                />
                <Text>sản phẩm</Text>
                <Text strong>({receivingSummary.totalQuantityToReceive})</Text>
                <Text>chiếc</Text>
              </Space>
            }
            type="info"
            showIcon
          />
        )}

        {/* Barcode Scanner */}
        <Card>
          <Space wrap>
            <Button
              type="primary"
              icon={<ScanOutlined />}
              onClick={() => setScannerOpen(true)}
              size="large"
            >
              Quét Mã Vạch
            </Button>
            <Button icon={<BarcodeOutlined />} size="large" disabled>
              Nhập Mã Thủ Công
            </Button>

            {/* Image Upload Buttons */}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: "none" }}
              id="image-upload-input"
            />
            <label htmlFor="image-upload-input">
              <Button
                icon={<PictureOutlined />}
                size="large"
                onClick={() =>
                  document.getElementById("image-upload-input")?.click()
                }
              >
                Chọn Ảnh ({selectedImages.length})
              </Button>
            </label>

            {/* Camera capture (works on mobile) */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              style={{ display: "none" }}
              id="camera-capture-input"
            />
            <label htmlFor="camera-capture-input">
              <Button
                icon={<CameraOutlined />}
                size="large"
                onClick={() =>
                  document.getElementById("camera-capture-input")?.click()
                }
              >
                Chụp Ảnh
              </Button>
            </label>

            {/* PDF Upload Button */}
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handlePdfSelect}
              style={{ display: "none" }}
              id="pdf-upload-input"
            />
            <label htmlFor="pdf-upload-input">
              <Button
                icon={<FilePdfOutlined />}
                size="large"
                type="primary"
                onClick={() =>
                  document.getElementById("pdf-upload-input")?.click()
                }
                loading={isAnalyzingPdf}
              >
                Chọn PDF ({selectedPdfs.length})
              </Button>
            </label>

            {/* Auto-fill from AI Analysis */}
            {(imageAnalysisResults.length > 0 ||
              pdfAnalysisResults.length > 0) && (
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                style={{ background: "#52c41a" }}
                onClick={matchAndFillFromAnalysis}
                disabled={isAnalyzing || isAnalyzingPdf}
              >
                Áp dụng AI → Điền số lượng
              </Button>
            )}
          </Space>

          {/* Image Preview */}
          {selectedImages.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Text strong>Ảnh đã chọn ({selectedImages.length}):</Text>
                <Space>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      const images = logImagePaths();
                      notification.info({
                        message: "Thông tin ảnh",
                        description: `Đã log thông tin ${images.length} ảnh vào console`,
                      });
                    }}
                  >
                    Xem thông tin trong Console
                  </Button>
                  <Button size="small" type="primary" onClick={uploadImages}>
                    Upload Ảnh
                  </Button>
                </Space>
              </Space>
              <Space wrap style={{ marginTop: 8 }}>
                {selectedImages.map((file, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{ width: 120 }}
                    cover={
                      <img
                        src={imagePreviewUrls[index]}
                        alt={file.name}
                        style={{
                          width: "100%",
                          height: 80,
                          objectFit: "cover",
                        }}
                      />
                    }
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveImage(index)}
                        size="small"
                      />,
                    ]}
                  >
                    <Card.Meta
                      description={
                        <Text ellipsis style={{ fontSize: 11 }}>
                          {file.name}
                        </Text>
                      }
                    />
                  </Card>
                ))}
              </Space>

              {/* AI Analysis Results */}
              {imageAnalysisResults.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>
                    Kết quả phân tích AI {isAnalyzing && <Spin size="small" />}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    {imageAnalysisResults.map((result, index) => (
                      <Card
                        key={index}
                        size="small"
                        style={{ marginBottom: 8 }}
                        title={
                          <Space>
                            <PictureOutlined />
                            <Text strong style={{ fontSize: 12 }}>
                              {result.fileName}
                            </Text>
                            {result.analyzing && (
                              <Tag color="blue">
                                <Spin size="small" /> Đang phân tích...
                              </Tag>
                            )}
                            {result.error && <Tag color="red">Lỗi</Tag>}
                            {!result.analyzing && !result.error && (
                              <Tag color="green">
                                <CheckCircleOutlined /> Hoàn tất
                              </Tag>
                            )}
                          </Space>
                        }
                      >
                        {result.error ? (
                          <Alert type="error" message={result.error} showIcon />
                        ) : result.analyzing ? (
                          <Space>
                            <Spin size="small" />
                            <Text type="secondary">
                              Đang phân tích ảnh với Gemini AI...
                            </Text>
                          </Space>
                        ) : (
                          <div>
                            {result.supplier && (
                              <div style={{ marginBottom: 8 }}>
                                <Text strong>Nhà cung cấp: </Text>
                                <Tag color="blue">{result.supplier}</Tag>
                              </div>
                            )}
                            {result.products && result.products.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <Text strong>Sản phẩm phát hiện:</Text>
                                <ul
                                  style={{ margin: "4px 0", paddingLeft: 20 }}
                                >
                                  {result.products.map((product, pIndex) => (
                                    <li key={pIndex}>
                                      <Text>
                                        {product.name}
                                        {product.quantity &&
                                          ` - SL: ${product.quantity}`}
                                      </Text>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div>
                              <Text strong>Chi tiết phân tích:</Text>
                              <div
                                style={{
                                  marginTop: 4,
                                  padding: 8,
                                  background: "#f5f5f5",
                                  borderRadius: 4,
                                  fontSize: 12,
                                  whiteSpace: "pre-wrap",
                                  maxHeight: 200,
                                  overflow: "auto",
                                }}
                              >
                                {result.text || "Không có kết quả"}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF Files Preview & Analysis */}
          {selectedPdfs.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Text strong>
                  File PDF đã chọn ({selectedPdfs.length})
                  {isAnalyzingPdf && (
                    <Spin size="small" style={{ marginLeft: 8 }} />
                  )}
                </Text>
              </Space>

              {/* PDF List */}
              <Space
                direction="vertical"
                style={{ width: "100%", marginTop: 8 }}
              >
                {selectedPdfs.map((file, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{ width: "100%" }}
                    title={
                      <Space>
                        <FilePdfOutlined style={{ color: "#ff4d4f" }} />
                        <Text strong style={{ fontSize: 12 }}>
                          {file.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </Text>
                      </Space>
                    }
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemovePdf(index)}
                        size="small"
                      >
                        Xóa
                      </Button>
                    }
                  >
                    {/* PDF Analysis Results */}
                    {pdfAnalysisResults[index] ? (
                      <div>
                        {pdfAnalysisResults[index].analyzing ? (
                          <Space>
                            <Spin size="small" />
                            <Text type="secondary">
                              Đang phân tích PDF với Gemini AI...
                            </Text>
                          </Space>
                        ) : pdfAnalysisResults[index].error ? (
                          <Alert
                            type="error"
                            message={pdfAnalysisResults[index].error}
                            showIcon
                          />
                        ) : (
                          <div>
                            {/* Structured Information */}
                            <Row gutter={[16, 8]} style={{ marginBottom: 12 }}>
                              {pdfAnalysisResults[index].supplier && (
                                <Col span={12}>
                                  <Text strong>Nhà cung cấp: </Text>
                                  <Tag color="blue">
                                    {pdfAnalysisResults[index].supplier}
                                  </Tag>
                                </Col>
                              )}
                              {pdfAnalysisResults[index].orderNumber && (
                                <Col span={12}>
                                  <Text strong>Số đơn hàng: </Text>
                                  <Tag color="green">
                                    {pdfAnalysisResults[index].orderNumber}
                                  </Tag>
                                </Col>
                              )}
                              {pdfAnalysisResults[index].orderDate && (
                                <Col span={12}>
                                  <Text strong>Ngày đặt: </Text>
                                  <Text>
                                    {pdfAnalysisResults[index].orderDate}
                                  </Text>
                                </Col>
                              )}
                              {pdfAnalysisResults[index].totalAmount && (
                                <Col span={12}>
                                  <Text strong>Tổng giá trị: </Text>
                                  <Text>
                                    {pdfAnalysisResults[
                                      index
                                    ].totalAmount?.toLocaleString()}{" "}
                                    VNĐ
                                  </Text>
                                </Col>
                              )}
                            </Row>

                            {/* Products List */}
                            {pdfAnalysisResults[index].products &&
                              pdfAnalysisResults[index].products!.length >
                                0 && (
                                <div style={{ marginBottom: 12 }}>
                                  <Text strong>
                                    Sản phẩm (
                                    {pdfAnalysisResults[index].products!.length}
                                    ):
                                  </Text>
                                  <Table
                                    size="small"
                                    dataSource={
                                      pdfAnalysisResults[index].products
                                    }
                                    pagination={false}
                                    style={{ marginTop: 8 }}
                                    columns={[
                                      {
                                        title: "Tên sản phẩm",
                                        dataIndex: "name",
                                        key: "name",
                                      },
                                      {
                                        title: "Số lượng",
                                        dataIndex: "quantity",
                                        key: "quantity",
                                        width: 100,
                                        render: (qty) => qty || "-",
                                      },
                                      // Removed: Đơn giá column - not needed for warehouse staff
                                      {
                                        title: "Mã SKU",
                                        dataIndex: "sku",
                                        key: "sku",
                                        width: 120,
                                        render: (sku) => sku || "-",
                                      },
                                    ]}
                                  />
                                </div>
                              )}

                            {/* Removed: Full Analysis Text/JSON - not needed for warehouse staff */}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Text type="secondary">Chưa phân tích</Text>
                    )}
                  </Card>
                ))}
              </Space>
            </div>
          )}
        </Card>

        {/* Products Table */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              Danh Sách Sản Phẩm ({selectedPO.items?.length || 0})
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirmReceiving}
                loading={confirming}
                disabled={!receivingSummary?.totalQuantityToReceive}
                size="large"
              >
                Xác Nhận Nhận Hàng
              </Button>
            </Space>
          }
        >
          {/* Removed: Cost price formula alert - not needed for warehouse staff */}
          <Table
            columns={productColumns}
            dataSource={selectedPO.items || []}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1800 }}
            size="large"
          />
        </Card>
      </Space>

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </PageLayout>
  );
};

export default PurchaseOrderReceivingDetailPage;
