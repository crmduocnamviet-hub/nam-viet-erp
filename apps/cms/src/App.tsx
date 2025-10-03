import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout"; // <-- Chúng ta sẽ tách Layout ra file riêng
import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { ScreenProvider } from "@nam-viet-erp/shared-components";
import { Spin, Row, notification } from "antd";
import { getEmployeeByUserId, signOut } from "@nam-viet-erp/services";
import { useInitializeEmployee, useEmployee, useEmployeeStore, useAuthStore } from "@nam-viet-erp/store";

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

  // Use store for employee data
  useInitializeEmployee(getEmployeeByUserId);
  const employee = useEmployee();
  const isLoading = useEmployeeStore((state) => state.isLoading);
  const error = useEmployeeStore((state) => state.error);

  const [accessDenied, setAccessDenied] = useState(false);

  // Check employee role when employee data is loaded
  useEffect(() => {
    const checkEmployeeRole = async () => {
      if (!session?.user) {
        setAccessDenied(false);
        return;
      }

      if (!employee) {
        // Still loading or error
        if (error) {
          await handleUnauthorizedAccess('Không tìm thấy thông tin nhân viên');
        }
        return;
      }

      // Check if user has admin or super-admin role
      const allowedRoles = ['admin', 'super-admin'];
      if (!allowedRoles.includes(employee.role_name)) {
        await handleUnauthorizedAccess(`Vai trò "${employee.role_name}" không được phép truy cập CMS`);
        return;
      }

      setAccessDenied(false);
    };

    checkEmployeeRole();
  }, [session, employee, error]);

  // Handle unauthorized access
  const handleUnauthorizedAccess = async (message: string) => {
    notification.error({
      message: 'Truy cập bị từ chối',
      description: `${message}. Chỉ admin và super-admin được phép truy cập CMS.`,
      duration: 5,
    });

    setAccessDenied(true);

    // Sign out after showing the notification
    setTimeout(async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }, 3000);
  };

  // Show loading while checking session or role
  if (loading || isLoading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Spin size="large" tip={isLoading ? "Đang kiểm tra quyền truy cập..." : "Đang tải..."}>
          <div style={{ minHeight: "200px" }} />
        </Spin>
      </Row>
    );
  }

  // Show access denied message
  if (accessDenied) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: 'center' }}>
          <h2>❌ Truy cập bị từ chối</h2>
          <p>Chỉ admin và super-admin được phép truy cập CMS.</p>
          <p>Đang đăng xuất...</p>
          <Spin />
        </div>
      </Row>
    );
  }

  return (
    <Routes>
      {/* Nếu chưa đăng nhập, chỉ có thể truy cập trang Login */}
      <Route path="/login" element={<Login />} />

      {/* Nếu đã đăng nhập, có thể truy cập các trang bên trong AppLayout */}
      <Route path="/*" element={session && employee ? (
        <ScreenProvider>
          <AppLayout />
        </ScreenProvider>
      ) : <Login />} />
    </Routes>
  );
};

export default App;
