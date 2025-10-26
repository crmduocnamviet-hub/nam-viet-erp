import { supabase } from "../supabase/supabase";
import { messaging, getToken, onMessage } from ".";

// Types
export interface IEmployeeFCMToken {
  id: number;
  employee_id: string;
  fcm_token: string;
  device_type: "web" | "android" | "ios";
  device_name?: string;
  user_agent?: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export interface INotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, any>;
  link?: string;
}

/**
 * Request permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.VITE_FIREBASE_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

/**
 * Register FCM token for an employee
 */
export const registerFCMToken = async (
  employeeId: string,
  fcmToken: string,
  deviceType: "web" | "android" | "ios" = "web",
  deviceName?: string,
) => {
  try {
    // Check if token already exists
    const { data: existing } = await supabase
      .from("employee_fcm_tokens")
      .select("*")
      .eq("fcm_token", fcmToken)
      .single();

    if (existing) {
      // Update existing token
      return await supabase
        .from("employee_fcm_tokens")
        .update({
          employee_id: employeeId,
          device_type: deviceType,
          device_name: deviceName,
          user_agent: navigator.userAgent,
          is_active: true,
          last_used_at: new Date().toISOString(),
        })
        .eq("fcm_token", fcmToken)
        .select()
        .single();
    } else {
      // Insert new token
      return await supabase
        .from("employee_fcm_tokens")
        .insert({
          employee_id: employeeId,
          fcm_token: fcmToken,
          device_type: deviceType,
          device_name: deviceName,
          user_agent: navigator.userAgent,
          is_active: true,
        })
        .select()
        .single();
    }
  } catch (error) {
    console.error("Error registering FCM token:", error);
    throw error;
  }
};

/**
 * Unregister FCM token
 */
export const unregisterFCMToken = async (fcmToken: string) => {
  return await supabase
    .from("employee_fcm_tokens")
    .update({ is_active: false })
    .eq("fcm_token", fcmToken);
};

/**
 * Get all active FCM tokens for an employee
 */
export const getEmployeeFCMTokens = async (employeeId: string) => {
  return await supabase
    .from("employee_fcm_tokens")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("is_active", true);
};

/**
 * Get all active FCM tokens for multiple employees
 */
export const getEmployeesFCMTokens = async (employeeIds: string[]) => {
  return await supabase
    .from("employee_fcm_tokens")
    .select("*")
    .in("employee_id", employeeIds)
    .eq("is_active", true);
};

/**
 * Delete inactive tokens (cleanup)
 */
export const cleanupInactiveFCMTokens = async (daysInactive: number = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  return await supabase
    .from("employee_fcm_tokens")
    .delete()
    .eq("is_active", false)
    .lt("last_used_at", cutoffDate.toISOString());
};

/**
 * Update token last used timestamp
 */
export const updateTokenLastUsed = async (fcmToken: string) => {
  return await supabase
    .from("employee_fcm_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("fcm_token", fcmToken);
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (
  callback: (payload: INotificationPayload) => void,
) => {
  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);

    const notification: INotificationPayload = {
      title: payload.notification?.title || "New Notification",
      body: payload.notification?.body || "",
      icon: payload.notification?.icon,
      image: payload.notification?.image,
      data: payload.data,
    };

    callback(notification);
  });
};

/**
 * Show browser notification
 */
export const showBrowserNotification = (notification: INotificationPayload) => {
  if ("Notification" in window && Notification.permission === "granted") {
    const notif = new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || "/logo.png",
      data: notification.data,
      badge: "/logo.png",
      tag: notification.data?.id || Date.now().toString(),
      requireInteraction: false,
    });

    notif.onclick = () => {
      if (notification.link) {
        window.open(notification.link, "_blank");
      }
      notif.close();
    };

    return notif;
  }
  return null;
};

/**
 * Initialize FCM for the current user
 * Call this when user logs in
 */
export const initializeFCMForEmployee = async (
  employeeId: string,
  deviceName?: string,
) => {
  try {
    // Request permission and get token
    const token = await requestNotificationPermission();

    if (token) {
      // Register token in database
      await registerFCMToken(employeeId, token, "web", deviceName);

      // Setup foreground message listener
      onForegroundMessage((notification) => {
        console.log("Notification received:", notification);
        showBrowserNotification(notification);
      });

      return token;
    }

    return null;
  } catch (error) {
    console.error("Error initializing FCM:", error);
    return null;
  }
};
