// Tab data structure for POS multi-tab system
interface PosTab {
  key?: string;
  id: string;
  title: string;
  cart: CartItem[];
  selectedCustomer: IPatient | null;
  selectedWarehouse: IWarehouse | null;
  selectedLocation: string;
  paymentMethod: "cash" | "card";
  isProcessingPayment: boolean;
  error: string | null;
  // Promotion state per tab
  promoCode: string;
  appliedPromoCode: string | null;
  promoDiscount: number;
  promoCodeError: string;
}
