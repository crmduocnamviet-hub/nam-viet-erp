import * as XLSX from "xlsx";
import dayjs from "dayjs";

/**
 * Xuất danh sách transactions ra file Excel
 * @param transactions Danh sách transactions
 * @param filename Tên file xuất (mặc định: "bao-cao-thu-chi.xlsx")
 */
export const exportTransactionsToExcel = (
  transactions: ITransaction[],
  filename: string = "bao-cao-thu-chi.xlsx",
): void => {
  try {
    // Map dữ liệu sang format Excel với headers tiếng Việt
    const dataToExport = transactions.map((transaction, index) => {
      const isIncome = transaction.type === "income";
      const amount = transaction.amount;

      return {
        STT: index + 1,
        "Số phiếu": transaction.id,
        "Ngày giao dịch": dayjs(transaction.transaction_date).format(
          "DD/MM/YYYY",
        ),
        Loại: isIncome ? "Thu" : "Chi",
        "Diễn giải": transaction.description || "",
        "Số tiền": amount,
        Thu: isIncome ? amount : 0,
        Chi: !isIncome ? amount : 0,
        "Quỹ/Tài khoản": (transaction as any).funds?.name || "Chưa thực thi",
        "Hình thức":
          transaction.payment_method === "cash" ? "Tiền mặt" : "Chuyển khoản",
        "Người nhận/nộp":
          transaction.recipient_name || transaction.created_by || "",
        "Ngân hàng": transaction.recipient_bank || "",
        STK: transaction.recipient_account || "",
        "Người tạo": transaction.created_by || "",
        "Trạng thái": transaction.status || "",
        "Người duyệt": transaction.approved_by || "",
        "Người thực hiện": transaction.executed_by || "",
        "Ngày tạo": dayjs(transaction.created_at).format("DD/MM/YYYY HH:mm"),
      };
    });

    // Tạo worksheet từ dữ liệu
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Tính tổng thu, tổng chi
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Thêm dòng tổng kết ở cuối
    const summaryRows = [
      {},
      {
        STT: "",
        "Số phiếu": "",
        "Ngày giao dịch": "",
        Loại: "",
        "Diễn giải": "TỔNG CỘNG",
        "Số tiền": totalIncome + totalExpense,
        Thu: totalIncome,
        Chi: totalExpense,
      },
      {
        STT: "",
        "Số phiếu": "",
        "Ngày giao dịch": "",
        Loại: "",
        "Diễn giải": "SỐ DỰ",
        "Số tiền": balance,
        Thu: "",
        Chi: "",
      },
    ];

    XLSX.utils.sheet_add_json(ws, summaryRows, {
      skipHeader: true,
      origin: -1, // Thêm vào cuối worksheet
    });

    // Thiết lập width cho các cột
    ws["!cols"] = [
      { wch: 5 }, // STT
      { wch: 10 }, // Số phiếu
      { wch: 12 }, // Ngày giao dịch
      { wch: 8 }, // Loại
      { wch: 35 }, // Diễn giải
      { wch: 15 }, // Số tiền
      { wch: 15 }, // Thu
      { wch: 15 }, // Chi
      { wch: 20 }, // Quỹ/Tài khoản
      { wch: 12 }, // Hình thức
      { wch: 25 }, // Người nhận/nộp
      { wch: 15 }, // Ngân hàng
      { wch: 20 }, // STK
      { wch: 20 }, // Người tạo
      { wch: 20 }, // Trạng thái
      { wch: 20 }, // Người duyệt
      { wch: 20 }, // Người thực hiện
      { wch: 18 }, // Ngày tạo
    ];

    // Tạo workbook và thêm worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo Thu Chi");

    // Xuất file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error("Error exporting transactions to Excel:", error);
    throw error;
  }
};

/**
 * Xuất template file Excel để import transactions
 */
export const exportTransactionsTemplate = (): void => {
  try {
    const templateData = [
      {
        "Ngày giao dịch": "01/01/2024",
        "Loại (Thu/Chi)": "Chi",
        "Diễn giải": "Thanh toán nhà cung cấp",
        "Số tiền": 5000000,
        "Hình thức (Tiền mặt/Chuyển khoản)": "Chuyển khoản",
        "Người nhận/nộp": "Công ty ABC",
        "Ngân hàng": "VCB",
        "Số tài khoản": "1234567890",
        "Ghi chú": "",
      },
      {
        "Ngày giao dịch": "02/01/2024",
        "Loại (Thu/Chi)": "Thu",
        "Diễn giải": "Thu tiền bán hàng",
        "Số tiền": 10000000,
        "Hình thức (Tiền mặt/Chuyển khoản)": "Tiền mặt",
        "Người nhận/nộp": "Khách hàng XYZ",
        "Ngân hàng": "",
        "Số tài khoản": "",
        "Ghi chú": "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Thiết lập width cho các cột
    ws["!cols"] = [
      { wch: 15 }, // Ngày giao dịch
      { wch: 15 }, // Loại
      { wch: 40 }, // Diễn giải
      { wch: 15 }, // Số tiền
      { wch: 30 }, // Hình thức
      { wch: 25 }, // Người nhận/nộp
      { wch: 15 }, // Ngân hàng
      { wch: 20 }, // Số tài khoản
      { wch: 30 }, // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Thu Chi");

    XLSX.writeFile(wb, "template-thu-chi.xlsx");
  } catch (error) {
    console.error("Error exporting template:", error);
    throw error;
  }
};

/**
 * Xuất báo cáo tổng hợp theo khoảng thời gian
 * @param transactions Danh sách transactions
 * @param startDate Ngày bắt đầu
 * @param endDate Ngày kết thúc
 * @param filename Tên file
 */
export const exportTransactionsSummary = (
  transactions: ITransaction[],
  startDate?: string,
  endDate?: string,
  filename: string = "bao-cao-tong-hop-thu-chi.xlsx",
): void => {
  try {
    // Filter by date range if provided
    let filteredTransactions = transactions;
    if (startDate && endDate) {
      filteredTransactions = transactions.filter((t) => {
        const transDate = dayjs(t.transaction_date);
        return (
          transDate.isAfter(dayjs(startDate).subtract(1, "day")) &&
          transDate.isBefore(dayjs(endDate).add(1, "day"))
        );
      });
    }

    // Group by date
    const groupedByDate = filteredTransactions.reduce(
      (acc: any, transaction) => {
        const date = dayjs(transaction.transaction_date).format("DD/MM/YYYY");
        if (!acc[date]) {
          acc[date] = {
            date,
            income: 0,
            expense: 0,
            count: 0,
          };
        }

        if (transaction.type === "income") {
          acc[date].income += transaction.amount;
        } else {
          acc[date].expense += transaction.amount;
        }
        acc[date].count += 1;

        return acc;
      },
      {},
    );

    // Convert to array and sort by date
    const summaryData = Object.values(groupedByDate)
      .map((item: any) => ({
        Ngày: item.date,
        "Số giao dịch": item.count,
        "Tổng thu": item.income,
        "Tổng chi": item.expense,
        "Chênh lệch": item.income - item.expense,
      }))
      .sort((a, b) => {
        return dayjs(a["Ngày"], "DD/MM/YYYY").isAfter(
          dayjs(b["Ngày"], "DD/MM/YYYY"),
        )
          ? 1
          : -1;
      });

    // Calculate totals
    const totalIncome = summaryData.reduce(
      (sum, row) => sum + row["Tổng thu"],
      0,
    );
    const totalExpense = summaryData.reduce(
      (sum, row) => sum + row["Tổng chi"],
      0,
    );
    const totalTransactions = summaryData.reduce(
      (sum, row) => sum + row["Số giao dịch"],
      0,
    );

    // Add summary row
    summaryData.push({
      Ngày: "TỔNG CỘNG",
      "Số giao dịch": totalTransactions,
      "Tổng thu": totalIncome,
      "Tổng chi": totalExpense,
      "Chênh lệch": totalIncome - totalExpense,
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(summaryData);

    // Set column widths
    ws["!cols"] = [
      { wch: 12 }, // Ngày
      { wch: 15 }, // Số giao dịch
      { wch: 18 }, // Tổng thu
      { wch: 18 }, // Tổng chi
      { wch: 18 }, // Chênh lệch
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add summary sheet
    XLSX.utils.book_append_sheet(wb, ws, "Tổng hợp");

    // Add detailed sheet
    exportTransactionsToDetailSheet(wb, filteredTransactions);

    // Export file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error("Error exporting summary:", error);
    throw error;
  }
};

/**
 * Helper function to add detailed transactions sheet
 */
const exportTransactionsToDetailSheet = (
  workbook: XLSX.WorkBook,
  transactions: ITransaction[],
): void => {
  const dataToExport = transactions.map((transaction, index) => {
    const isIncome = transaction.type === "income";
    return {
      STT: index + 1,
      Ngày: dayjs(transaction.transaction_date).format("DD/MM/YYYY"),
      Loại: isIncome ? "Thu" : "Chi",
      "Diễn giải": transaction.description || "",
      "Số tiền": transaction.amount,
      "Trạng thái": transaction.status || "",
      "Người tạo": transaction.created_by || "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(dataToExport);

  ws["!cols"] = [
    { wch: 5 }, // STT
    { wch: 12 }, // Ngày
    { wch: 8 }, // Loại
    { wch: 40 }, // Diễn giải
    { wch: 15 }, // Số tiền
    { wch: 20 }, // Trạng thái
    { wch: 20 }, // Người tạo
  ];

  XLSX.utils.book_append_sheet(workbook, ws, "Chi tiết");
};
