import React from "react";
import { useNavigate } from "react-router-dom";
import { RegisterForm } from "@nam-viet-erp/shared-components";
import logo from "../assets/logo.png";

const Register: React.FC = () => {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    // Navigate to login after successful registration
    setTimeout(() => {
      navigate("/login");
    }, 3000);
  };

  return (
    <RegisterForm
      logo={logo}
      appName="Nam Việt Sale"
      onRegisterSuccess={handleRegisterSuccess}
      loginPath="/login"
    />
  );
};

export default Register;
