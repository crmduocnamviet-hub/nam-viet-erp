import React, { type ReactNode } from "react";
import { Layout } from "antd";

const { Content } = Layout;

interface AppLayoutProps {
  children?: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content>{children}</Content>
    </Layout>
  );
};

export default AppLayout;
