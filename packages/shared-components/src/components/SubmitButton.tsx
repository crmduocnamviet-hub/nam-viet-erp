import { Button } from "antd";
import React from "react";

const ConfirmButton: React.FC<{
  loading?: boolean;
  onClose?: () => any;
  hideCancelButton?: boolean;
}> = ({ loading, onClose, hideCancelButton }) => {
  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 16,
        borderTop: "1px solid #f0f0f0",
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
      }}
    >
      {!hideCancelButton && (
        <Button onClick={onClose} size="large">
          Hủy
        </Button>
      )}
      <Button
        type="primary"
        htmlType="submit"
        loading={loading}
        onClick={() => console.log("Submit button clicked")}
        size="large"
      >
        Lưu
      </Button>
    </div>
  );
};

export default ConfirmButton;
