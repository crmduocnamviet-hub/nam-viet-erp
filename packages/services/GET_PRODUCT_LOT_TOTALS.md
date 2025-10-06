# Get Product Lot Totals Across All Warehouses

## Quick Reference

### Function: `getProductLotTotals`

Get aggregated total quantities of a product across all warehouses.

## Usage

```typescript
import { getProductLotTotals } from '@nam-viet-erp/services';

// Get totals across ALL warehouses
const { data, error } = await getProductLotTotals({
  productId: 123,
});

// Get totals for specific warehouse only
const { data, error } = await getProductLotTotals({
  productId: 123,
  warehouseId: 1,
});
```

## Response Structure

```typescript
{
  data: {
    // Breakdown by each warehouse
    by_warehouse: [
      {
        warehouse_id: 1,
        warehouse_name: "Kho Chính",
        total_received: 1000,      // Total nhập về
        total_available: 750,      // Còn lại
        total_reserved: 150,       // Đã đặt
        total_sold: 100,           // Đã bán
        lots_count: 5,             // Số lô tại kho này
      },
      // ... more warehouses
    ],

    // Overall totals across all warehouses
    overall: {
      total_received: 1500,        // Tổng nhập
      total_available: 1150,       // Tổng còn lại
      total_reserved: 200,         // Tổng đã đặt
      total_sold: 150,             // Tổng đã bán
      total_lots: 8,               // Tổng số lô
      warehouses_count: 2,         // Số kho có hàng
    }
  },
  error: null
}
```

## Real-World Examples

### 1. Display Total Stock in Product Card

```typescript
const ProductStockSummary = ({ productId }) => {
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    const fetchTotals = async () => {
      const { data } = await getProductLotTotals({ productId });
      setTotals(data);
    };
    fetchTotals();
  }, [productId]);

  if (!totals) return null;

  return (
    <Card title="Tồn kho">
      <Statistic
        title="Tổng còn lại"
        value={totals.overall.total_available}
        suffix={`từ ${totals.overall.total_lots} lô`}
      />
      <Divider />
      <Text type="secondary">
        Phân bổ tại {totals.overall.warehouses_count} kho
      </Text>
    </Card>
  );
};
```

### 2. Check Stock Before Order

```typescript
const checkStockAvailability = async (productId, requiredQty) => {
  const { data } = await getProductLotTotals({ productId });

  if (!data) {
    throw new Error('Không thể kiểm tra tồn kho');
  }

  const { overall } = data;

  if (overall.total_available < requiredQty) {
    return {
      available: false,
      message: `Chỉ còn ${overall.total_available}/${requiredQty} sản phẩm`,
      shortage: requiredQty - overall.total_available,
    };
  }

  return {
    available: true,
    message: `Đủ hàng (còn ${overall.total_available})`,
  };
};

// Usage
const result = await checkStockAvailability(123, 500);
if (!result.available) {
  notification.warning({
    message: 'Không đủ hàng',
    description: result.message,
  });
}
```

### 3. Warehouse Distribution Chart

```typescript
const WarehouseDistribution = ({ productId }) => {
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    const fetchTotals = async () => {
      const { data } = await getProductLotTotals({ productId });
      setTotals(data);
    };
    fetchTotals();
  }, [productId]);

  if (!totals) return null;

  // Prepare data for chart
  const chartData = totals.by_warehouse.map(w => ({
    warehouse: w.warehouse_name,
    available: w.total_available,
    reserved: w.total_reserved,
    sold: w.total_sold,
  }));

  return (
    <Card title="Phân bổ kho">
      <Table
        dataSource={totals.by_warehouse}
        size="small"
        pagination={false}
        columns={[
          {
            title: 'Kho',
            dataIndex: 'warehouse_name',
            render: (name, record) => (
              <>
                <Text strong>{name}</Text>
                <br />
                <Text type="secondary">{record.lots_count} lô</Text>
              </>
            ),
          },
          {
            title: 'Còn lại',
            dataIndex: 'total_available',
            render: (val, record) => (
              <Progress
                percent={Math.round(
                  (val / totals.overall.total_available) * 100
                )}
                format={() => val}
              />
            ),
          },
        ]}
      />
    </Card>
  );
};
```

### 4. Multi-Warehouse Order Fulfillment

```typescript
const findBestWarehouse = async (productId, requiredQty) => {
  const { data } = await getProductLotTotals({ productId });

  if (!data) return null;

  // Find warehouse with enough stock
  const suitableWarehouse = data.by_warehouse.find(
    w => w.total_available >= requiredQty
  );

  if (suitableWarehouse) {
    return {
      single_warehouse: true,
      warehouse_id: suitableWarehouse.warehouse_id,
      warehouse_name: suitableWarehouse.warehouse_name,
    };
  }

  // Need to combine from multiple warehouses
  const sortedWarehouses = [...data.by_warehouse].sort(
    (a, b) => b.total_available - a.total_available
  );

  let remaining = requiredQty;
  const allocation = [];

  for (const warehouse of sortedWarehouses) {
    if (remaining <= 0) break;

    const qty = Math.min(warehouse.total_available, remaining);
    allocation.push({
      warehouse_id: warehouse.warehouse_id,
      warehouse_name: warehouse.warehouse_name,
      quantity: qty,
    });
    remaining -= qty;
  }

  if (remaining > 0) {
    return {
      single_warehouse: false,
      sufficient: false,
      shortage: remaining,
    };
  }

  return {
    single_warehouse: false,
    sufficient: true,
    allocation,
  };
};

// Usage
const fulfillment = await findBestWarehouse(123, 500);

if (fulfillment.single_warehouse) {
  console.log(`Lấy từ kho ${fulfillment.warehouse_name}`);
} else if (fulfillment.sufficient) {
  console.log('Cần lấy từ nhiều kho:');
  fulfillment.allocation.forEach(a => {
    console.log(`- ${a.warehouse_name}: ${a.quantity}`);
  });
} else {
  console.log(`Thiếu ${fulfillment.shortage} sản phẩm`);
}
```

### 5. Stock Alert Dashboard

```typescript
const StockAlert = ({ productId, minStock = 100 }) => {
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    const fetchTotals = async () => {
      const { data } = await getProductLotTotals({ productId });
      setTotals(data);
    };
    fetchTotals();
  }, [productId]);

  if (!totals) return null;

  const { overall, by_warehouse } = totals;
  const isLowStock = overall.total_available < minStock;
  const emptyWarehouses = by_warehouse.filter(w => w.total_available === 0);

  return (
    <>
      {isLowStock && (
        <Alert
          type="warning"
          message="Tồn kho thấp"
          description={`Chỉ còn ${overall.total_available} sản phẩm (yêu cầu tối thiểu: ${minStock})`}
          showIcon
        />
      )}

      {emptyWarehouses.length > 0 && (
        <Alert
          type="info"
          message="Kho hết hàng"
          description={
            <ul>
              {emptyWarehouses.map(w => (
                <li key={w.warehouse_id}>{w.warehouse_name}</li>
              ))}
            </ul>
          }
          showIcon
        />
      )}
    </>
  );
};
```

## When to Use

✅ **Use `getProductLotTotals` when you need:**
- Overall total quantities across all warehouses
- Breakdown by warehouse
- Quick stock check without lot details
- Dashboard statistics
- Stock allocation planning

❌ **Don't use when you need:**
- Individual lot details (use `getProductLots` instead)
- Expiry date information (use `getProductLots` instead)
- Lot selection for orders (use `getAvailableLots` instead)

## Performance

- ✅ Fast: Only aggregates quantities, doesn't return individual lot records
- ✅ Efficient: Single database query with grouping
- ✅ Scalable: Works well even with many lots

## Related Functions

- `getProductLots()` - Get individual lots with details
- `getAvailableLots()` - Get lots with FIFO/FEFO for order fulfillment
- `getLotInventorySummary()` - Get lots across multiple products
