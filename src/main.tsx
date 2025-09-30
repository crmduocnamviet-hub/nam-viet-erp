import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "antd/dist/reset.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { App as AntApp } from "antd";
import { PermissionProvider } from "./context/PermissionContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AntApp>
        {" "}
        {/* Đảm bảo AntApp được sử dụng ở đây - tránh lỗi deploy trên netlify */}
        <AuthProvider>
          <PermissionProvider>
            <App />
          </PermissionProvider>
        </AuthProvider>
      </AntApp>
    </BrowserRouter>
  </React.StrictMode>
);
