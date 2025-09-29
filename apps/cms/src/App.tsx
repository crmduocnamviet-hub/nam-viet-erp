import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout"; // <-- Chúng ta sẽ tách Layout ra file riêng
import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { ScreenProvider, ROLE_PERMISSIONS } from "@nam-viet-erp/shared-components";
import { Spin, Row, notification } from "antd";
import { getEmployeeByUserId, signOut } from "@nam-viet-erp/services";

const App: React.FC = () => {
  const { session, loading } = useAuth();
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Fetch employee role when session is available
  useEffect(() => {
    const checkEmployeeRole = async () => {
      if (!session?.user) {
        setEmployee(null);
        setAccessDenied(false);
        return;
      }

      setRoleLoading(true);
      try {
        const { data: employeeData, error } = await getEmployeeByUserId(session.user.id);

        if (error || !employeeData) {
          console.warn('Employee not found for user:', session.user.id);
          await handleUnauthorizedAccess('Không tìm thấy thông tin nhân viên');
          return;
        }

        // Check if user has admin or super-admin role
        const allowedRoles = ['admin', 'super-admin'];
        if (!allowedRoles.includes(employeeData.role_name)) {
          await handleUnauthorizedAccess(`Vai trò "${employeeData.role_name}" không được phép truy cập CMS`);
          return;
        }

        setEmployee(employeeData);
        setAccessDenied(false);
      } catch (error) {
        console.error('Error checking employee role:', error);
        await handleUnauthorizedAccess('Lỗi khi kiểm tra quyền truy cập');
      } finally {
        setRoleLoading(false);
      }
    };

    checkEmployeeRole();
  }, [session]);

  // Handle unauthorized access
  const handleUnauthorizedAccess = async (message: string) => {
    notification.error({
      message: 'Truy cập bị từ chối',
      description: `${message}. Chỉ admin và super-admin được phép truy cập CMS.`,
      duration: 5,
    });

    setAccessDenied(true);
    setEmployee(null);

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
  if (loading || roleLoading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Spin size="large" tip={roleLoading ? "Đang kiểm tra quyền truy cập..." : "Đang tải..."}>
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

  // Create user object for permissions based on actual employee role
  const user = session && employee ? {
    id: session.user.id,
    name: employee.full_name,
    permissions: ROLE_PERMISSIONS[employee.role_name as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS['super-admin'],
    role: employee.role_name
  } : null;

  return (
    <Routes>
      {/* Nếu chưa đăng nhập, chỉ có thể truy cập trang Login */}
      <Route path="/login" element={<Login />} />

      {/* Nếu đã đăng nhập, có thể truy cập các trang bên trong AppLayout */}
      <Route path="/*" element={session && user ? (
        <ScreenProvider user={user}>
          <AppLayout />
        </ScreenProvider>
      ) : <Login />} />
    </Routes>
  );
};

export default App;
