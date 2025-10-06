# How to Get Product Lots

This guide explains how to retrieve lot/batch information for products in the system.

## Available Functions

### 1. `getProductLots` - Get lots for a specific product
**Best for**: Getting all lots of a single product

```typescript
import { getProductLots } from '@nam-viet-erp/services';

// Get all lots for a product
const { data, error } = await getProductLots({
  productId: 123,
});

// Get lots for a product in a specific warehouse
const { data, error } = await getProductLots({
  productId: 123,
  warehouseId: 1,
});

// Get only available lots (quantity > 0)
const { data, error } = await getProductLots({
  productId: 123,
  onlyAvailable: true,
});

// Get available lots in specific warehouse
const { data, error } = await getProductLots({
  productId: 123,
  warehouseId: 1,
  onlyAvailable: true,
});
```

**Returns**:
```typescript
{
  data: [
    {
      id: 1,
      product_id: 123,
      warehouse_id: 1,
      lot_number: "LOT001",
      expiry_date: "2025-12-31",
      manufacturing_date: "2024-01-15",
      quantity_received: 100,
      quantity_available: 75,
      quantity_reserved: 20,
      quantity_sold: 5,
      final_unit_cost: 95000,
      warehouse_name: "Kho Chính",
      days_until_expiry: 365,
      status: "active",
      // ... other fields
    }
  ],
  error: null
}
```

### 2. `getLotInventorySummary` - Get lots with product details
**Best for**: Getting lots across multiple products or warehouses

```typescript
import { getLotInventorySummary } from '@nam-viet-erp/services';

// Get all lots in system
const { data, error } = await getLotInventorySummary();

// Get lots for a specific product
const { data, error } = await getLotInventorySummary({
  productId: 123,
});

// Get lots in a specific warehouse
const { data, error } = await getLotInventorySummary({
  warehouseId: 1,
});

// Get lots with specific status
const { data, error } = await getLotInventorySummary({
  status: 'active', // 'active', 'reserved', 'expired', 'depleted'
});

// Combine filters
const { data, error } = await getLotInventorySummary({
  productId: 123,
  warehouseId: 1,
  status: 'active',
  includeExpired: true,
});
```

**Returns**:
```typescript
{
  data: [
    {
      id: 1,
      product_id: 123,
      product_name: "Dầu gội Clear 500ml",
      product_sku: "CLR-500",
      warehouse_id: 1,
      warehouse_name: "Kho Chính",
      lot_number: "LOT001",
      expiry_date: "2025-12-31",
      quantity_available: 75,
      days_until_expiry: 365,
      // ... other fields
    }
  ],
  error: null
}
```

### 3. `getProductLotTotals` - Get aggregated totals across warehouses
**Best for**: Getting total quantities across all warehouses

```typescript
import { getProductLotTotals } from '@nam-viet-erp/services';

// Get totals for a product across all warehouses
const { data, error } = await getProductLotTotals({
  productId: 123,
});

// Get totals for a specific warehouse only
const { data, error } = await getProductLotTotals({
  productId: 123,
  warehouseId: 1,
});
```

**Returns**:
```typescript
{
  data: {
    by_warehouse: [
      {
        warehouse_id: 1,
        warehouse_name: "Kho Chính",
        total_received: 1000,
        total_available: 750,
        total_reserved: 150,
        total_sold: 100,
        lots_count: 5,
      },
      {
        warehouse_id: 2,
        warehouse_name: "Kho B2B",
        total_received: 500,
        total_available: 400,
        total_reserved: 50,
        total_sold: 50,
        lots_count: 3,
      }
    ],
    overall: {
      total_received: 1500,
      total_available: 1150,
      total_reserved: 200,
      total_sold: 150,
      total_lots: 8,
      warehouses_count: 2,
    }
  },
  error: null
}
```

### 4. `getAvailableLots` - Get lots using FIFO/FEFO strategy
**Best for**: Selecting lots for order fulfillment

```typescript
import { getAvailableLots } from '@nam-viet-erp/services';

// Get available lots using FEFO (First Expired First Out)
const { data, error } = await getAvailableLots({
  productId: 123,
  warehouseId: 1,
  requiredQuantity: 50,
  strategy: 'FEFO', // or 'FIFO'
});

// Get lots with VAT invoice only
const { data, error } = await getAvailableLots({
  productId: 123,
  warehouseId: 1,
  requiredQuantity: 50,
  strategy: 'FEFO',
  requireVat: true,
});
```

**Returns**:
```typescript
{
  data: [
    {
      lot_id: 1,
      lot_number: "LOT001",
      expiry_date: "2025-12-31",
      shelf_location: "A1-R3-L2",
      quantity_available: 50,
      vat_available: 30,
      unit_cost: 95000,
      days_until_expiry: 365,
      recommended_quantity: 50,
    }
  ],
  error: null
}
```

## Usage Examples

### Example 1: Display Total Stock Across All Warehouses

```typescript
import { getProductLotTotals } from '@nam-viet-erp/services';
import { Card, Row, Col, Statistic, Table } from 'antd';

const ProductTotalStock = ({ productId }) => {
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTotals = async () => {
      setLoading(true);
      const { data, error } = await getProductLotTotals({ productId });

      if (!error && data) {
        setTotals(data);
      }
      setLoading(false);
    };

    fetchTotals();
  }, [productId]);

  if (!totals) return null;

  return (
    <>
      {/* Overall Totals */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Tồn Kho"
              value={totals.overall.total_available}
              suffix={`/ ${totals.overall.total_received}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã Đặt"
              value={totals.overall.total_reserved}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã Bán"
              value={totals.overall.total_sold}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Số Lô"
              value={totals.overall.total_lots}
              suffix={`kho: ${totals.overall.warehouses_count}`}
            />
          </Card>
        </Col>
      </Row>

      {/* By Warehouse */}
      <Table
        dataSource={totals.by_warehouse}
        rowKey="warehouse_id"
        columns={[
          {
            title: 'Kho',
            dataIndex: 'warehouse_name',
          },
          {
            title: 'Còn lại',
            dataIndex: 'total_available',
          },
          {
            title: 'Đã đặt',
            dataIndex: 'total_reserved',
          },
          {
            title: 'Số lô',
            dataIndex: 'lots_count',
          },
        ]}
      />
    </>
  );
};
```

### Example 2: Display Product Lots in UI

```typescript
import { getProductLots } from '@nam-viet-erp/services';
import { useState, useEffect } from 'react';

const ProductLotsTable = ({ productId }) => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLots = async () => {
      setLoading(true);
      const { data, error } = await getProductLots({
        productId,
        onlyAvailable: true,
      });

      if (!error && data) {
        setLots(data);
      }
      setLoading(false);
    };

    fetchLots();
  }, [productId]);

  return (
    <Table
      loading={loading}
      dataSource={lots}
      columns={[
        {
          title: 'Số lô',
          dataIndex: 'lot_number',
        },
        {
          title: 'Kho',
          dataIndex: 'warehouse_name',
        },
        {
          title: 'HSD',
          dataIndex: 'expiry_date',
          render: (date, record) => (
            <>
              {dayjs(date).format('DD/MM/YYYY')}
              <br />
              <Text type={record.days_until_expiry <= 30 ? 'danger' : 'secondary'}>
                {record.days_until_expiry} ngày
              </Text>
            </>
          ),
        },
        {
          title: 'Còn lại',
          dataIndex: 'quantity_available',
        },
      ]}
    />
  );
};
```

### Example 2: Select Lot for Order

```typescript
import { getAvailableLots } from '@nam-viet-erp/services';

const selectLotsForOrder = async (productId, warehouseId, quantity) => {
  const { data: availableLots, error } = await getAvailableLots({
    productId,
    warehouseId,
    requiredQuantity: quantity,
    strategy: 'FEFO', // First Expired First Out
  });

  if (error) {
    console.error('Error getting lots:', error);
    return null;
  }

  // System automatically suggests lots based on FEFO
  return availableLots;
};

// Usage in order processing
const processOrder = async (orderItem) => {
  const lots = await selectLotsForOrder(
    orderItem.product_id,
    orderItem.warehouse_id,
    orderItem.quantity
  );

  if (!lots || lots.length === 0) {
    throw new Error('Không đủ hàng tồn kho');
  }

  // Use the recommended lots
  for (const lot of lots) {
    await reserveLotQuantity({
      lotId: lot.lot_id,
      quantity: lot.recommended_quantity,
      orderId: orderItem.order_id,
      orderType: 'sales',
      employeeId: currentUser.id,
    });
  }
};
```

### Example 3: Check Product Lot Availability

```typescript
import { getProductLots } from '@nam-viet-erp/services';

const checkProductAvailability = async (productId, warehouseId) => {
  const { data: lots, error } = await getProductLots({
    productId,
    warehouseId,
    onlyAvailable: true,
  });

  if (error) {
    console.error('Error:', error);
    return { available: false, quantity: 0 };
  }

  const totalAvailable = lots.reduce(
    (sum, lot) => sum + lot.quantity_available,
    0
  );

  const expiringLots = lots.filter(
    (lot) => lot.days_until_expiry && lot.days_until_expiry <= 30
  );

  return {
    available: totalAvailable > 0,
    quantity: totalAvailable,
    lotsCount: lots.length,
    expiringCount: expiringLots.length,
    lots: lots,
  };
};

// Usage
const availability = await checkProductAvailability(123, 1);
console.log(`Có ${availability.quantity} sản phẩm từ ${availability.lotsCount} lô`);
console.log(`Cảnh báo: ${availability.expiringCount} lô sắp hết hạn`);
```

### Example 4: Get Expiring Lots Alert

```typescript
import { getExpiringLots } from '@nam-viet-erp/services';

const checkExpiringProducts = async (warehouseId) => {
  const { data: expiringLots, error } = await getExpiringLots({
    warehouseId,
    daysUntilExpiry: 30, // Lots expiring in 30 days
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Send notification
  if (expiringLots.length > 0) {
    notification.warning({
      message: 'Cảnh báo sản phẩm sắp hết hạn',
      description: `Có ${expiringLots.length} lô sắp hết hạn trong 30 ngày`,
    });
  }

  return expiringLots;
};
```

## Filtering and Sorting

### Common Filters

```typescript
// Only active lots
const activeLots = await getLotInventorySummary({
  status: 'active',
});

// Only lots with quantity
const availableLots = await getProductLots({
  productId: 123,
  onlyAvailable: true,
});

// Lots in specific warehouse
const warehouseLots = await getProductLots({
  productId: 123,
  warehouseId: 1,
});
```

### Sort Lots by Expiry Date (Client-side)

```typescript
const { data: lots } = await getProductLots({ productId: 123 });

// Already sorted by expiry_date (ascending) from the API
// But you can re-sort if needed:
const sortedByExpiry = [...lots].sort((a, b) => {
  if (!a.expiry_date) return 1;
  if (!b.expiry_date) return -1;
  return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
});
```

## Error Handling

```typescript
const { data, error } = await getProductLots({
  productId: 123,
});

if (error) {
  // Handle specific errors
  if (error.code === 'PGRST116') {
    console.error('No lots found for product');
  } else {
    console.error('Database error:', error.message);
  }
  return;
}

// Use data safely
if (data && data.length > 0) {
  console.log('Found lots:', data);
} else {
  console.log('No lots available');
}
```

## Related Functions

- `createProductLot` - Create a new lot
- `updateProductLot` - Update lot information
- `reserveLotQuantity` - Reserve quantity from a lot
- `sellLotQuantity` - Sell from a lot
- `getLotMovements` - Get lot movement history
- `verifyBarcode` - Verify product barcode against lots
