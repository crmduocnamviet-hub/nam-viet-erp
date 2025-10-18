# Patient Points System - Implementation Guide

Complete guide for implementing and using the patient loyalty points system.

---

## Overview

The patient points system allows you to:

- **Earn points** when patients make purchases
- **Redeem points** for discounts on future purchases
- **Track complete history** of all points transactions
- **Expire points** automatically after a certain period
- **Manually adjust** points when needed

---

## Database Setup

### Step 1: Run the Migration

Execute the SQL migration to create the necessary tables and functions:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U your-user -d your-db -f database/migrations/create_patient_points_history.sql
```

Or use Supabase Dashboard:

1. Go to SQL Editor
2. Copy contents from `create_patient_points_history.sql`
3. Click "Run"

### Step 2: Verify Installation

Check that the following were created:

- Table: `patient_points_history`
- View: `patient_points_summary`
- Function: `log_patient_points_change()`
- Trigger: `trigger_log_patient_points_change`

```sql
-- Verify table
SELECT * FROM patient_points_history LIMIT 1;

-- Verify view
SELECT * FROM patient_points_summary LIMIT 5;
```

---

## TypeScript Integration

### Import the Service

```typescript
import {
  addPointsToPatient,
  redeemPointsFromPatient,
  getPatientPointsHistory,
  getPatientPointsSummary,
  calculatePointsToEarn,
  calculateDiscountFromPoints,
} from "@nam-viet-erp/services/src/patientPointsService";
```

---

## Usage Examples

### 1. Award Points When Patient Makes a Purchase

```typescript
// Example: Patient buys products worth 250,000 VND
const orderValue = 250000;
const pointsToEarn = calculatePointsToEarn(orderValue); // 25 points (1 point per 10,000 VND)

try {
  const { data, error } = await addPointsToPatient({
    patientId: "patient-uuid-here",
    points: pointsToEarn,
    referenceType: "order",
    referenceId: "order-uuid-here",
    description: `Earned from purchase #${orderNumber}`,
    notes: `Order total: ${orderValue.toLocaleString()} VND`,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 1 year
    createdBy: employeeId,
  });

  if (error) {
    console.error("Failed to add points:", error);
  } else {
    console.log(
      `Added ${pointsToEarn} points. New balance: ${data.balance_after}`,
    );
  }
} catch (error) {
  console.error("Error:", error.message);
}
```

### 2. Redeem Points for Discount

```typescript
// Example: Patient wants to use 50 points for discount
const pointsToRedeem = 50;
const discountValue = calculateDiscountFromPoints(pointsToRedeem); // 50,000 VND (1 point = 1,000 VND)

try {
  const { data, error } = await redeemPointsFromPatient({
    patientId: "patient-uuid-here",
    points: pointsToRedeem,
    referenceType: "order",
    referenceId: "order-uuid-here",
    description: `Redeemed for ${discountValue.toLocaleString()} VND discount`,
    notes: `Applied to order #${orderNumber}`,
    createdBy: employeeId,
  });

  if (error) {
    console.error("Failed to redeem points:", error);
  } else {
    console.log(
      `Redeemed ${pointsToRedeem} points. Remaining balance: ${data.balance_after}`,
    );
    // Apply discount to order
    const finalTotal = orderTotal - discountValue;
  }
} catch (error) {
  console.error("Error:", error.message);
}
```

### 3. Get Patient Points History

```typescript
// Get complete history for a patient
const { data: history, error } = await getPatientPointsHistory(
  "patient-uuid-here",
  {
    limit: 20,
    offset: 0,
  },
);

if (history) {
  history.forEach((transaction) => {
    console.log(
      `${transaction.created_at}: ${transaction.transaction_type} ${transaction.points_amount} points`,
    );
    console.log(
      `Balance: ${transaction.balance_before} → ${transaction.balance_after}`,
    );
    console.log(`Reason: ${transaction.description}`);
  });
}
```

### 4. Get Patient Points Summary

```typescript
// Get summary of all points activity
const { data: summary, error } =
  await getPatientPointsSummary("patient-uuid-here");

if (summary) {
  console.log(`Current Balance: ${summary.current_balance}`);
  console.log(`Total Earned: ${summary.total_earned}`);
  console.log(`Total Redeemed: ${summary.total_redeemed}`);
  console.log(`Total Expired: ${summary.total_expired}`);
  console.log(`Total Transactions: ${summary.transaction_count}`);
}
```

### 5. Manual Points Adjustment

```typescript
// Example: Staff gives bonus points for special promotion
import { adjustPatientPoints } from "@nam-viet-erp/services/src/patientPointsService";

try {
  const { data, error } = await adjustPatientPoints({
    patientId: "patient-uuid-here",
    pointsAdjustment: 100, // Positive for adding, negative for removing
    referenceType: "promotion",
    description: "Birthday bonus points",
    notes: "Annual birthday gift - 100 bonus points",
    createdBy: employeeId,
  });

  if (error) {
    console.error("Failed to adjust points:", error);
  } else {
    console.log(`Adjusted points. New balance: ${data.balance_after}`);
  }
} catch (error) {
  console.error("Error:", error.message);
}
```

### 6. Birthday Bonus Points

```typescript
// Automatically give points on patient's birthday
const today = new Date();
const patientBirthday = new Date(patient.date_of_birth);

if (
  today.getMonth() === patientBirthday.getMonth() &&
  today.getDate() === patientBirthday.getDate()
) {
  await addPointsToPatient({
    patientId: patient.patient_id,
    points: 50,
    referenceType: "birthday",
    description: "Happy Birthday! Bonus points",
    createdBy: "system",
  });
}
```

---

## Points Configuration

### Default Settings

You can customize these values in your application:

```typescript
// Points earning rate
const POINTS_PER_AMOUNT = 10000; // 1 point per 10,000 VND

// Points redemption value
const VALUE_PER_POINT = 1000; // 1 point = 1,000 VND discount

// Points expiration
const POINTS_EXPIRATION_DAYS = 365; // Points expire after 1 year

// Minimum points to redeem
const MIN_POINTS_TO_REDEEM = 10;

// Maximum points per transaction
const MAX_POINTS_PER_TRANSACTION = 1000;
```

### Custom Calculation Functions

```typescript
// Custom points calculation (e.g., VIP customers get 2x points)
function calculatePointsWithBonus(orderValue: number, isVIP: boolean): number {
  const basePoints = calculatePointsToEarn(orderValue);
  return isVIP ? basePoints * 2 : basePoints;
}

// Tiered discount value (more points = better rate)
function calculateTieredDiscount(points: number): number {
  if (points >= 1000) return points * 1500; // Premium rate
  if (points >= 500) return points * 1200; // Better rate
  return points * 1000; // Standard rate
}
```

---

## Integration with POS System

### In PosPage Component

```typescript
// When creating an order
const handleCheckout = async () => {
  const orderTotal = calculateOrderTotal();

  // Step 1: Ask if patient wants to use points
  const pointsToRedeem = await askPatientForPointsRedemption();

  if (pointsToRedeem > 0) {
    const discount = calculateDiscountFromPoints(pointsToRedeem);

    // Redeem points
    await redeemPointsFromPatient({
      patientId: selectedPatient.patient_id,
      points: pointsToRedeem,
      referenceType: "order",
      description: `Discount on POS order`,
      createdBy: currentEmployee.employee_id,
    });

    // Apply discount
    finalTotal = orderTotal - discount;
  }

  // Create order...
  const order = await createOrder({
    /* ... */
  });

  // Step 2: Award points for this purchase
  const pointsEarned = calculatePointsToEarn(finalTotal);

  if (pointsEarned > 0) {
    await addPointsToPatient({
      patientId: selectedPatient.patient_id,
      points: pointsEarned,
      referenceType: "order",
      referenceId: order.order_id,
      description: `Earned from POS purchase`,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: currentEmployee.employee_id,
    });

    // Show notification
    notification.success({
      message: `Earned ${pointsEarned} points!`,
      description: `Total points: ${updatedBalance}`,
    });
  }
};
```

---

## Display Points in Patient Detail Page

```typescript
// In PatientDetailPage component
const [pointsSummary, setPointsSummary] = useState<IPatientPointsSummary | null>(null);
const [pointsHistory, setPointsHistory] = useState<IPatientPointsHistory[]>([]);

useEffect(() => {
  // Fetch points summary
  getPatientPointsSummary(patientId).then(({ data }) => {
    setPointsSummary(data);
  });

  // Fetch recent history
  getPatientPointsHistory(patientId, { limit: 10 }).then(({ data }) => {
    setPointsHistory(data || []);
  });
}, [patientId]);

// Display in UI
<Card title="Loyalty Points">
  <Statistic
    title="Current Balance"
    value={pointsSummary?.current_balance || 0}
    suffix="points"
  />
  <Statistic
    title="Lifetime Earned"
    value={pointsSummary?.total_earned || 0}
    suffix="points"
  />
  <Statistic
    title="Lifetime Redeemed"
    value={pointsSummary?.total_redeemed || 0}
    suffix="points"
  />
</Card>

<Table
  dataSource={pointsHistory}
  columns={[
    { title: "Date", dataIndex: "created_at", render: (date) => formatDate(date) },
    { title: "Type", dataIndex: "transaction_type" },
    { title: "Points", dataIndex: "points_amount" },
    { title: "Balance", dataIndex: "balance_after" },
    { title: "Description", dataIndex: "description" },
  ]}
/>
```

---

## Scheduled Tasks

### Auto-Expire Old Points

Run this as a cron job (e.g., daily at midnight):

```typescript
import { processExpiredPoints } from "@nam-viet-erp/services/src/patientPointsService";

// In your scheduled task
async function runDailyPointsExpiration() {
  try {
    const result = await processExpiredPoints();
    console.log(`Processed ${result.processed} patients`);
    console.log(`Total points expired: ${result.totalPointsExpired}`);
  } catch (error) {
    console.error("Failed to process expired points:", error);
  }
}

// Schedule with node-cron or similar
cron.schedule("0 0 * * *", runDailyPointsExpiration);
```

---

## Transaction Types

| Type         | Description       | Points Amount     | Use Case                      |
| ------------ | ----------------- | ----------------- | ----------------------------- |
| `earn`       | Points earned     | Positive          | Purchase, promotion, referral |
| `redeem`     | Points used       | Negative          | Discount on purchase          |
| `adjustment` | Manual adjustment | Positive/Negative | Correction, bonus, penalty    |
| `expire`     | Points expired    | Negative          | Automatic expiration          |
| `refund`     | Points refunded   | Positive          | Order cancellation            |

---

## Reference Types

| Type        | Description        | Example              |
| ----------- | ------------------ | -------------------- |
| `order`     | From sales order   | Purchase transaction |
| `visit`     | From medical visit | Doctor visit fee     |
| `manual`    | Manual by staff    | Staff adjustment     |
| `promotion` | From promotion     | Special campaign     |
| `birthday`  | Birthday bonus     | Annual gift          |
| `referral`  | Referral reward    | Friend referral      |
| `system`    | System action      | Auto-expiration      |

---

## Best Practices

### 1. Always Use Transactions

Wrap points operations in try-catch blocks to handle errors gracefully.

### 2. Provide Clear Descriptions

Always include meaningful descriptions so patients understand where points came from.

### 3. Set Expiration Dates

Set expiration dates for earned points to encourage usage.

### 4. Validate Before Redemption

Check if patient has enough points before attempting redemption.

### 5. Log Employee Actions

Always pass `created_by` to track who performed the action.

### 6. Show Points on Receipt

Display earned/redeemed points on printed receipts.

---

## Security Considerations

### Row Level Security (RLS)

Add RLS policies to protect points data:

```sql
-- Only allow authenticated users to view
ALTER TABLE patient_points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view all points history"
  ON patient_points_history FOR SELECT
  TO authenticated
  USING (true);

-- Only allow insert through service functions
CREATE POLICY "Only service can insert points"
  ON patient_points_history FOR INSERT
  TO service_role
  WITH CHECK (true);
```

---

## Troubleshooting

### Issue: Balance mismatch

**Solution**: The trigger automatically updates patient balance, but you can verify:

```sql
-- Check if balance matches history
SELECT
  p.patient_id,
  p.loyalty_points AS current_balance,
  COALESCE(SUM(h.points_amount), 0) AS calculated_balance
FROM patients p
LEFT JOIN patient_points_history h ON p.patient_id = h.patient_id
GROUP BY p.patient_id, p.loyalty_points
HAVING p.loyalty_points != COALESCE(SUM(h.points_amount), 0);
```

### Issue: Points not showing in history

**Solution**: Check if trigger is enabled:

```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'patients'::regclass
  AND tgname = 'trigger_log_patient_points_change';
```

---

## Rollback

If you need to remove the points system:

```bash
psql -h your-db-host -U your-user -d your-db -f database/migrations/rollback_patient_points_history.sql
```

**WARNING**: This will delete all points history data!

---

## Support

For questions or issues:

- Check the migration SQL comments
- Review the TypeScript service functions
- Contact development team

---

**Last Updated**: January 2025

**Version**: 1.0.0
