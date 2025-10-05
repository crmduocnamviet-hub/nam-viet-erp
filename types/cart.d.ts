// CartItem type definition
interface BaseCartItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  finalPrice: number;
  originalPrice: number;
  prescriptionNote?: string;
}

// Extended CartItem type for POS with additional properties
type CartItem = BaseCartItem & {
  key?: string;
  discount?: number;
  appliedPromotion?: any;
  stock_quantity?: number;
  image_url?: string | null;
  product_id?: string;
  unit_price?: number;
  prescription_id?: string;
  total?: number;
  price?: number;

  // Combo-related fields
  isCombo?: boolean; // True if this is a combo item (not a regular product)
  combo_id?: number; // ID of the combo
  comboData?: IComboWithItems; // Full combo data including items
};

type CartDetails = {
  items: CartItem[];
  itemTotal: number;
  originalTotal: number;
  totalDiscount: number;
};

type PriceInfo = {
  finalPrice: number;
  originalPrice: number;
  appliedPromotion?: any;
};

// PaymentValues type definition
interface PaymentValues {
  customer_cash?: number;
  payment_method: "cash" | "card" | "qr";
  total: number;
}
