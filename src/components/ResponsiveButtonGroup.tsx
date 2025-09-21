// src/components/ResponsiveButtonGroup.tsx

import React from "react";
import { Space, Button } from "antd";

interface ButtonConfig {
  text: string;
  icon?: React.ReactNode;
  onClick: () => void;
  type?: "primary" | "default" | "dashed" | "link" | "text";
  danger?: boolean;
}

interface ResponsiveButtonGroupProps {
  buttons: ButtonConfig[];
}

const ResponsiveButtonGroup: React.FC<ResponsiveButtonGroupProps> = ({
  buttons,
}) => {
  return (
    <Space wrap>
      {buttons.map((btn, index) => (
        <Button
          key={index}
          type={btn.type || "default"}
          danger={btn.danger}
          icon={btn.icon}
          onClick={btn.onClick}
        >
          {btn.text}
        </Button>
      ))}
    </Space>
  );
};

export default ResponsiveButtonGroup;
