-- Create notifications table
-- Purpose: Store in-app notifications for employees
-- Date: 2025-10-26

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,

  -- Employee Reference
  employee_id UUID NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,

  -- Notification Type (for filtering and categorization)
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'order_new',           -- Đơn hàng mới
    'order_updated',       -- Đơn hàng cập nhật
    'order_cancelled',     -- Đơn hàng hủy
    'inventory_low',       -- Hàng sắp hết
    'inventory_expired',   -- Hàng hết hạn
    'appointment_new',     -- Lịch hẹn mới
    'appointment_reminder', -- Nhắc lịch hẹn
    'appointment_cancelled', -- Lịch hẹn hủy
    'quote_new',           -- Báo giá mới
    'quote_updated',       -- Báo giá cập nhật
    'purchase_order',      -- Đơn nhập hàng
    'payment_due',         -- Nhắc thanh toán
    'task_assigned',       -- Công việc được giao
    'system',              -- Thông báo hệ thống
    'other'                -- Khác
  )),

  -- Notification Content
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,

  -- Priority
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Additional Data (JSON for flexibility)
  metadata JSONB DEFAULT '{}',
  -- Examples:
  -- For order: {"order_id": 123, "customer_name": "ABC", "total": 1000000}
  -- For inventory: {"product_id": 456, "product_name": "XYZ", "quantity": 5, "min_stock": 10}
  -- For appointment: {"appointment_id": 789, "patient_name": "Nguyen Van A", "time": "14:00"}

  -- Action
  action_url VARCHAR(500), -- URL to navigate when clicked (e.g., /orders/123)
  action_label VARCHAR(100), -- Button text (e.g., "Xem đơn hàng", "Xem chi tiết")

  -- Icon/Image
  icon VARCHAR(255), -- Icon URL or name
  image_url VARCHAR(500), -- Optional image URL

  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Send to Push Notification
  sent_to_fcm BOOLEAN DEFAULT false,
  fcm_sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES employees(employee_id),

  -- Expiry (optional - for auto-cleanup)
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notifications_employee_id ON notifications(employee_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_employee_unread ON notifications(employee_id, is_read) WHERE is_read = false;

-- Composite index for common queries
CREATE INDEX idx_notifications_employee_type_date ON notifications(employee_id, notification_type, created_at DESC);

-- GIN index for JSONB metadata queries
CREATE INDEX idx_notifications_metadata ON notifications USING GIN (metadata);

-- Comments
COMMENT ON TABLE notifications IS 'Stores in-app notifications for employees';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification for categorization and filtering';
COMMENT ON COLUMN notifications.metadata IS 'Additional data in JSON format specific to notification type';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate when notification is clicked';
COMMENT ON COLUMN notifications.is_read IS 'Whether employee has read this notification';
COMMENT ON COLUMN notifications.sent_to_fcm IS 'Whether this notification was sent via Firebase Cloud Messaging';
COMMENT ON COLUMN notifications.expires_at IS 'When this notification should be auto-deleted (optional)';

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for an employee
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(emp_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE employee_id = emp_id AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(emp_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE employee_id = emp_id AND is_read = false;

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup expired notifications (run via cron/scheduled job)
-- DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW();
