// Supabase Edge Function for processing POS sale orders
// This function handles the entire sale transaction in a more atomic way

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  finalPrice: number;
  isCombo?: boolean;
  comboData?: any;
  lot_id?: number;
  lotSelections?: Array<{
    lot_id: number;
    product_id: number;
    quantity: number;
  }>;
}

interface ProcessSaleRequest {
  cart: CartItem[];
  total: number;
  paymentMethod: string;
  warehouseId: number;
  fundId: number;
  createdBy: string | null;
  customerId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const requestData: ProcessSaleRequest = await req.json();
    const {
      cart,
      total,
      paymentMethod,
      warehouseId,
      fundId,
      createdBy,
      customerId,
    } = requestData;

    console.log("[Process Sale] Starting transaction for order:", {
      total,
      itemCount: cart.length,
      warehouseId,
    });

    // Step 0: Pre-flight check for lot quantities
    const lotQuantitiesRequired: Record<number, number> = {};

    cart.forEach((item) => {
      if (item.isCombo && item.comboData) {
        // Handle lot-managed products within combos
        if (item.lotSelections && item.lotSelections.length > 0) {
          item.lotSelections.forEach((lotSelection) => {
            const comboItem = item.comboData.combo_items?.find(
              (ci: any) => ci.product_id === lotSelection.product_id,
            );
            if (comboItem) {
              const required = comboItem.quantity * item.quantity;
              lotQuantitiesRequired[lotSelection.lot_id] =
                (lotQuantitiesRequired[lotSelection.lot_id] || 0) + required;
            }
          });
        }
      } else {
        // Handle regular lot-managed products
        if (item.lot_id) {
          lotQuantitiesRequired[item.lot_id] =
            (lotQuantitiesRequired[item.lot_id] || 0) + item.quantity;
        }
      }
    });

    // Verify lot quantities
    if (Object.keys(lotQuantitiesRequired).length > 0) {
      const lotIds = Object.keys(lotQuantitiesRequired).map(Number);
      const { data: lotsData, error: lotsError } = await supabase
        .from("product_lots")
        .select("id, quantity, lot_number")
        .in("id", lotIds);

      if (lotsError) {
        throw new Error(
          `Could not verify lot quantities: ${lotsError.message}`,
        );
      }

      for (const lot of lotsData || []) {
        const required = lotQuantitiesRequired[lot.id];
        if ((lot.quantity || 0) < required) {
          throw new Error(
            `Không đủ số lượng cho lô "${lot.lot_number}". Cần: ${required}, Tồn kho: ${
              lot.quantity || 0
            }`,
          );
        }
      }
    }

    // Step 1: Create sales order
    const salesOrder = {
      patient_id: customerId || null,
      order_type: "pos",
      total_value: total,
      payment_method: paymentMethod,
      payment_status: "paid",
      operational_status: "completed",
      is_ai_checked: false,
      created_by_employee_id: createdBy || null,
    };

    const { data: orderData, error: orderError } = await supabase
      .from("sales_orders")
      .insert(salesOrder)
      .select()
      .single();

    if (orderError || !orderData) {
      throw new Error(
        `Failed to create sales order: ${orderError?.message || "Unknown error"}`,
      );
    }

    console.log("[Process Sale] Created order:", orderData.order_id);

    // Step 2: Prepare order items, combo items, and lot items
    const orderItems: any[] = [];
    const comboItems: any[] = [];
    const productLotItems: any[] = [];

    cart.forEach((item) => {
      if (item.isCombo && item.comboData) {
        // Process combo items
        const comboData = item.comboData;
        comboData.combo_items?.forEach((comboItem: any) => {
          const itemQuantity = comboItem.quantity * item.quantity;
          const itemPrice =
            item.finalPrice /
            (comboData.combo_items?.reduce(
              (sum: number, ci: any) => sum + ci.quantity,
              0,
            ) || 1);

          const lotSelection = item.lotSelections?.find(
            (ls) => ls.product_id === comboItem.product_id,
          );

          comboItems.push({
            order_id: orderData.order_id,
            combo_id: item.id,
            product_id: comboItem.product_id,
            quantity: itemQuantity,
            unit_price: itemPrice,
            // Note: lot_id is NOT stored in sales_combo_items
            // It's tracked separately in sales_order_product_lot_items
          });

          if (lotSelection?.lot_id) {
            productLotItems.push({
              order_id: orderData.order_id,
              lot_id: lotSelection.lot_id,
              quantity: itemQuantity,
            });
          }
        });
      } else {
        // Regular product
        orderItems.push({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.finalPrice || 0,
          is_service: false,
          // Note: lot_id is NOT stored in sales_order_items
          // It's tracked separately in sales_order_product_lot_items
        });

        if (item.lot_id) {
          productLotItems.push({
            order_id: orderData.order_id,
            lot_id: item.lot_id,
            quantity: item.quantity,
          });
        }
      }
    });

    // Insert sales order items
    if (orderItems.length > 0) {
      const itemsWithOrderId = orderItems.map((item) => ({
        ...item,
        order_id: orderData.order_id,
      }));

      const { error: itemsError } = await supabase
        .from("sales_order_items")
        .insert(itemsWithOrderId);

      if (itemsError) {
        // Rollback: delete the sales order
        await supabase
          .from("sales_orders")
          .delete()
          .eq("order_id", orderData.order_id);
        throw new Error(
          `Failed to create sales order items: ${itemsError.message}`,
        );
      }
    }

    console.log("[Process Sale] Created order items:", orderItems.length);

    // Insert combo items
    if (comboItems.length > 0) {
      const { error: comboItemsError } = await supabase
        .from("sales_combo_items")
        .insert(comboItems);

      if (comboItemsError) {
        console.error("Sales Combo Items Creation Error:", comboItemsError);
        // Continue - combo items tracking is supplementary
      }
    }

    console.log("[Process Sale] Created combo items:", comboItems.length);

    // Insert product lot items tracking
    if (productLotItems.length > 0) {
      const { error: productLotItemsError } = await supabase
        .from("sales_order_product_lot_items")
        .insert(productLotItems);

      if (productLotItemsError) {
        console.error(
          "Product Lot Items Creation Error:",
          productLotItemsError,
        );
        // Continue - lot tracking is supplementary
      }
    }

    console.log(
      "[Process Sale] Created lot tracking items:",
      productLotItems.length,
    );

    // Step 3: Create financial transaction record
    const transactionRecord = {
      type: "income",
      amount: total,
      description: `POS Sale - Order ${orderData.order_id} - Warehouse ID ${warehouseId}`,
      payment_method: paymentMethod,
      status: "đã thu",
      transaction_date: new Date().toISOString(),
      created_by: createdBy,
      fund_id: fundId,
    };

    const { data: transactionData, error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionRecord)
      .select()
      .single();

    if (transactionError) {
      // Rollback: delete sales order
      await supabase
        .from("sales_orders")
        .delete()
        .eq("order_id", orderData.order_id);
      throw new Error(
        `Failed to create transaction: ${transactionError.message}`,
      );
    }

    console.log("[Process Sale] Created transaction:", transactionData.id);

    // Step 4: Update inventory
    // Calculate product quantities
    const quantities: Record<number, number> = {};

    cart.forEach((item) => {
      if (item.isCombo && item.comboData) {
        item.comboData.combo_items?.forEach((comboItem: any) => {
          const productId = comboItem.product_id;
          const qty = comboItem.quantity * item.quantity;
          quantities[productId] = (quantities[productId] || 0) + qty;
        });
      } else {
        quantities[item.id] = (quantities[item.id] || 0) + item.quantity;
      }
    });

    // Get current inventory
    const productIds = Object.keys(quantities).map(Number);
    const { data: inventoryData, error: inventoryFetchError } = await supabase
      .from("inventory")
      .select("product_id, quantity")
      .eq("warehouse_id", warehouseId)
      .in("product_id", productIds);

    if (inventoryFetchError) {
      console.error("Inventory fetch error:", inventoryFetchError);
    }

    // Prepare inventory updates
    const inventoryUpdates: any[] = [];

    Object.entries(quantities).forEach(([productId, qty]) => {
      const currentInventory = inventoryData?.find(
        (inv: any) => inv.product_id === Number(productId),
      );
      const currentQuantity = currentInventory?.quantity || 0;
      const newQuantity = currentQuantity - qty;

      inventoryUpdates.push({
        product_id: Number(productId),
        warehouse_id: warehouseId,
        quantity: newQuantity,
      });
    });

    // Update inventory using upsert
    if (inventoryUpdates.length > 0) {
      const { error: inventoryError } = await supabase
        .from("inventory")
        .upsert(inventoryUpdates, {
          onConflict: "product_id,warehouse_id",
        });

      if (inventoryError) {
        // Rollback transaction and sales order
        await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionData.id);
        await supabase
          .from("sales_orders")
          .delete()
          .eq("order_id", orderData.order_id);
        throw new Error(
          `Failed to update inventory: ${inventoryError.message}`,
        );
      }
    }

    console.log("[Process Sale] Updated inventory:", inventoryUpdates.length);

    // Step 5: Deduct lot quantities
    if (productLotItems.length > 0) {
      for (const lotItem of productLotItems) {
        const { error: lotError } = await supabase.rpc("deduct_lot_quantity", {
          p_lot_id: lotItem.lot_id,
          p_quantity: lotItem.quantity,
        });

        if (lotError) {
          console.error(
            `Lot deduction error for lot ${lotItem.lot_id}:`,
            lotError,
          );
          // Continue - log error but don't rollback entire transaction
        }
      }
    }

    console.log("[Process Sale] Deducted lot quantities");

    // Step 6: Create VAT invoice records
    const vatInvoiceItems: any[] = [];

    // Create a map of product_id -> lot_id from productLotItems for quick lookup
    const productLotMap = new Map();
    productLotItems.forEach((lotItem) => {
      // For products with multiple lots, we'll use the first one
      if (!productLotMap.has(lotItem.lot_id)) {
        // We need to find which product this lot belongs to
        // This is tracked in productLotItems array
        const cartItem = cart.find((item) => {
          if (item.lot_id === lotItem.lot_id) return true;
          if (item.lotSelections) {
            return item.lotSelections.some(
              (ls) => ls.lot_id === lotItem.lot_id,
            );
          }
          return false;
        });

        if (cartItem) {
          if (cartItem.lot_id === lotItem.lot_id) {
            // Regular product
            productLotMap.set(cartItem.id, lotItem.lot_id);
          } else if (cartItem.lotSelections) {
            // Combo product
            const selection = cartItem.lotSelections.find(
              (ls) => ls.lot_id === lotItem.lot_id,
            );
            if (selection) {
              productLotMap.set(selection.product_id, lotItem.lot_id);
            }
          }
        }
      }
    });

    // Regular order items - VAT mặc định 10%
    orderItems.forEach((item) => {
      vatInvoiceItems.push({
        warehouse_id: warehouseId,
        product_id: item.product_id,
        product_lot_id: productLotMap.get(item.product_id) || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.unit_price * item.quantity,
        vat_amount: (item.unit_price * item.quantity * 10) / 100,
        vat_percent: 10,
        b2b_quote_id: null,
        sale_order_id: orderData.order_id,
        status: "pending",
      });
    });

    // Combo items - VAT mặc định 10%
    comboItems.forEach((item) => {
      vatInvoiceItems.push({
        warehouse_id: warehouseId,
        product_id: item.product_id,
        product_lot_id: productLotMap.get(item.product_id) || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.unit_price * item.quantity,
        vat_amount: (item.unit_price * item.quantity * 10) / 100,
        vat_percent: 10,
        b2b_quote_id: null,
        sale_order_id: orderData.order_id,
        status: "pending",
      });
    });

    if (vatInvoiceItems.length > 0) {
      const { error: vatError } = await supabase
        .from("vat_invoices_out")
        .insert(vatInvoiceItems);

      if (vatError) {
        console.warn("Failed to create VAT invoices:", vatError);
        // Don't throw error - VAT invoice can be created manually later
      }
    }

    console.log("[Process Sale] Created VAT invoices:", vatInvoiceItems.length);

    // Step 6: Award loyalty points to patient if customer exists
    if (customerId) {
      try {
        // Get applicable point rule for this warehouse
        let pointRule = null;

        // First try to get warehouse-specific rule
        // Query for rules that apply to all branches OR include this warehouse
        const { data: warehouseRules, error: warehouseError } = await supabase
          .from("point_rules")
          .select("*")
          .eq("is_active", true)
          .or(
            `applies_to_all_branches.eq.true,warehouse_ids.cs.{${warehouseId}}`,
          );

        if (!warehouseError && warehouseRules && warehouseRules.length > 0) {
          // Prefer default rule, otherwise use first active rule
          pointRule =
            warehouseRules.find((r) => r.is_default) || warehouseRules[0];
        } else {
          // Fallback to default rule
          const { data: defaultRule } = await supabase
            .from("point_rules")
            .select("*")
            .eq("is_active", true)
            .eq("is_default", true)
            .single();
          pointRule = defaultRule;
        }

        if (pointRule && pointRule.is_active) {
          // Calculate points to earn
          const pointsToEarn = Math.floor(
            (total / pointRule.accumulation_spend_amount) *
              pointRule.accumulation_points_earned,
          );

          if (pointsToEarn > 0) {
            // Get current patient points
            const { data: patient, error: patientError } = await supabase
              .from("patients")
              .select("loyalty_points")
              .eq("patient_id", customerId)
              .single();

            if (!patientError && patient) {
              const balanceBefore = patient.loyalty_points || 0;
              const balanceAfter = balanceBefore + pointsToEarn;

              // Create points history record
              const { error: historyError } = await supabase
                .from("patient_points_history")
                .insert({
                  patient_id: customerId,
                  transaction_type: "earn",
                  points_amount: pointsToEarn,
                  balance_before: balanceBefore,
                  balance_after: balanceAfter,
                  reference_type: "order",
                  reference_id: orderData.order_id.toString(),
                  description: `Earned from POS purchase - Order ${orderData.order_id}`,
                  notes: `Order total: ${total.toLocaleString()} VND`,
                  expires_at: new Date(
                    Date.now() + 365 * 24 * 60 * 60 * 1000,
                  ).toISOString(), // Expires in 1 year
                  created_by: createdBy,
                });

              if (!historyError) {
                // Update patient loyalty points
                await supabase
                  .from("patients")
                  .update({ loyalty_points: balanceAfter })
                  .eq("patient_id", customerId);

                console.log(
                  `[Process Sale] Awarded ${pointsToEarn} points to patient ${customerId}. New balance: ${balanceAfter}`,
                );
              } else {
                console.warn(
                  "[Process Sale] Failed to create points history:",
                  historyError,
                );
              }
            }
          }
        }
      } catch (pointsError) {
        // Don't fail the entire transaction if points calculation fails
        console.warn("[Process Sale] Points calculation error:", pointsError);
      }
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderData,
          transactionData,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("[Process Sale Error]:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An error occurred while processing the sale",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
