import React, { createContext, useContext, ReactNode } from "react";
import {
  SCREEN_REGISTRY,
  ScreenConfig,
  hasScreenPermission,
  getAvailableScreens,
} from "../screens";

interface User {
  id: string;
  name: string;
  permissions: string[];
  role: string;
}

interface ScreenProviderProps {
  children: ReactNode;
  user: User | null;
  context?: Record<string, any>; // Additional context to pass to screens
}

interface ScreenContextType {
  user: User | null;
  context: Record<string, any>;
  renderScreen: (
    screenKey: string,
    props?: Record<string, any>
  ) => React.ReactElement | null;
  hasPermission: (screenKey: string) => boolean;
  getAvailableScreensForUser: () => Record<string, ScreenConfig>;
  getScreenComponent: (screenKey: string) => React.ComponentType<any> | null;
}

const ScreenContext = createContext<ScreenContextType | undefined>(undefined);

export const ScreenProvider: React.FC<ScreenProviderProps> = ({
  children,
  user,
  context = {},
}) => {
  const renderScreen = (screenKey: string, props: Record<string, any> = {}) => {
    const screen = SCREEN_REGISTRY[screenKey];
    if (!screen) {
      console.warn(`Screen '${screenKey}' not found in registry`);
      return null;
    }

    // Check permissions
    if (!user || !hasScreenPermission(screenKey, user.permissions)) {
      return (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            color: "#ff4d4f",
            fontSize: "16px",
          }}
        >
          <h3>Không có quyền truy cập</h3>
          <p>Bạn không có quyền truy cập trang này.</p>
        </div>
      );
    }

    const Component = screen.component;
    const combinedProps = {
      ...context,
      ...screen.props,
      ...props,
      user,
    };

    return <Component {...combinedProps} />;
  };

  const hasPermission = (screenKey: string): boolean => {
    if (!user) return false;
    return hasScreenPermission(screenKey, user.permissions);
  };

  const getAvailableScreensForUser = (): Record<string, ScreenConfig> => {
    if (!user) return {};
    return getAvailableScreens(user.permissions);
  };

  const getScreenComponent = (
    screenKey: string
  ): React.ComponentType<any> | null => {
    const screen = SCREEN_REGISTRY[screenKey];
    return screen ? screen.component : null;
  };

  const value: ScreenContextType = {
    user,
    context,
    renderScreen,
    hasPermission,
    getAvailableScreensForUser,
    getScreenComponent,
  };

  return (
    <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>
  );
};

export const useScreens = (): ScreenContextType => {
  const context = useContext(ScreenContext);
  if (context === undefined) {
    throw new Error("useScreens must be used within a ScreenProvider");
  }
  return context;
};

// Higher-order component for protecting screens
export const withScreenPermission = (screenKey: string) => {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedScreen(props: P) {
      const { hasPermission, renderScreen } = useScreens();

      if (!hasPermission(screenKey)) {
        return renderScreen("auth.unauthorized");
      }

      return <Component {...props} />;
    };
  };
};

// Component for rendering screens by key
export const Screen: React.FC<{
  screenKey: string;
  props?: Record<string, any>;
  fallback?: React.ReactNode;
}> = ({ screenKey, props = {}, fallback = null }) => {
  const { renderScreen, hasPermission } = useScreens();

  if (!hasPermission(screenKey)) {
    return <>{fallback}</>;
  }

  return renderScreen(screenKey, props);
};
