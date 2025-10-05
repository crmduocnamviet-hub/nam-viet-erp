import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { Spin, Row } from "antd";
import AuthenticatedApp from "./components/AuthenticatedApp";
import {
  useInitializeEmployee,
  useInitializeInventory,
  useAuthStore,
  useInventoryStore,
} from "@nam-viet-erp/store";
import { getEmployeeByUserId } from "@nam-viet-erp/services";

const App: React.FC = () => {
  const { session, loading } = useAuth();

  // Sync session to auth store
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (session?.user) {
      setUser(session.user as any);
      setSession(session as any);
    } else {
      setUser(null);
      setSession(null);
    }
  }, [session, setUser, setSession]);

  // Initialize employee data from store
  useInitializeEmployee(getEmployeeByUserId);

  // Initialize inventory for employees with inventory permissions
  useInitializeInventory();

  if (loading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Spin size="large" />
      </Row>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={session ? <AuthenticatedApp /> : <Login />} />
    </Routes>
  );
};

export default App;
