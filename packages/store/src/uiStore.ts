import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  isMobile: boolean;
  notifications: Notification[];
  modals: Record<string, boolean>;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setIsMobile: (isMobile: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modalName: string) => void;
  closeModal: (modalName: string) => void;
  toggleModal: (modalName: string) => void;
  isModalOpen: (modalName: string) => boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
}

export const useUIStore = create<UIState>()(
  devtools(
    immer((set, get) => ({
      sidebarCollapsed: false,
      theme: 'light',
      isMobile: false,
      notifications: [],
      modals: {},

      toggleSidebar: () =>
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        }, false, 'toggleSidebar'),

      setSidebarCollapsed: (collapsed) =>
        set((state) => {
          state.sidebarCollapsed = collapsed;
        }, false, 'setSidebarCollapsed'),

      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
        }, false, 'setTheme'),

      toggleTheme: () =>
        set((state) => {
          state.theme = state.theme === 'light' ? 'dark' : 'light';
        }, false, 'toggleTheme'),

      setIsMobile: (isMobile) =>
        set((state) => {
          state.isMobile = isMobile;
        }, false, 'setIsMobile'),

      addNotification: (notification) =>
        set((state) => {
          state.notifications.push({
            ...notification,
            id: Date.now().toString(),
          });
        }, false, 'addNotification'),

      removeNotification: (id) =>
        set((state) => {
          state.notifications = state.notifications.filter((n) => n.id !== id);
        }, false, 'removeNotification'),

      clearNotifications: () =>
        set((state) => {
          state.notifications = [];
        }, false, 'clearNotifications'),

      openModal: (modalName) =>
        set((state) => {
          state.modals[modalName] = true;
        }, false, 'openModal'),

      closeModal: (modalName) =>
        set((state) => {
          state.modals[modalName] = false;
        }, false, 'closeModal'),

      toggleModal: (modalName) =>
        set((state) => {
          state.modals[modalName] = !state.modals[modalName];
        }, false, 'toggleModal'),

      isModalOpen: (modalName) => {
        const { modals } = get();
        return !!modals[modalName];
      },
    })),
    {
      name: 'UIStore',
    }
  )
);

// Selectors
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useTheme = () => useUIStore((state) => state.theme);
export const useIsMobile = () => useUIStore((state) => state.isMobile);
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useIsModalOpen = (modalName: string) =>
  useUIStore((state) => state.isModalOpen(modalName));
