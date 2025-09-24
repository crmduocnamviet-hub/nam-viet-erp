import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { EmployeeProvider } from "./context/EmployeeContext";
import { ScreenProvider, ROLE_PERMISSIONS } from "@nam-viet-erp/shared-components";
import { Spin, Row } from "antd";

const App: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Spin size="large" />
      </Row>
    );
  }

  // Create user object for permissions (placeholder - would typically come from auth)
  const user = session ? {
    id: 'current-user',
    name: 'Current User',
    permissions: ROLE_PERMISSIONS['sales-staff'], // Use sales-staff permissions for sale app
    role: 'sales-staff'
  } : null;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={session && user ? (
        <EmployeeProvider>
          <ScreenProvider user={user}>
            <AppLayout />
          </ScreenProvider>
        </EmployeeProvider>
      ) : <Login />} />
    </Routes>
  );
};

export default App;
