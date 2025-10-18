// Screen Provider and Screen Management Interfaces

interface User {
  id: string;
  name: string;
  permissions: string[];
  role: string;
}

interface ScreenProviderProps {
  children: React.ReactNode;
  context?: Record<string, any>; // Additional context to pass to screens
}

interface ScreenContextType {
  user: User | null;
  employee: any;
  context: Record<string, any>;
  renderScreen: (
    screenKey: string,
    props?: Record<string, any>,
  ) => React.ReactElement | null;
  hasPermission: (screenKey: string) => boolean;
  getAvailableScreensForUser: () => Record<string, ScreenConfig>;
  getScreenComponent: (screenKey: string) => React.ComponentType<any> | null;
}
