import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { EmployeeProvider } from "./context/EmployeeContext";
import { Spin, Row } from "antd";
import AuthenticatedApp from "./components/AuthenticatedApp";

const App: React.FC = () => {
  const { session, loading } = useAuth();

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
      <Route path="/*" element={session ? (
        <EmployeeProvider>
          <AuthenticatedApp />
        </EmployeeProvider>
      ) : <Login />} />
    </Routes>
  );
};

export default App;
