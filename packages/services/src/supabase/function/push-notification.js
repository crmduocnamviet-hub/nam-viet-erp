// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { initializeApp, cert } from "npm:firebase-admin/app";
import { getMessaging } from "npm:firebase-admin/messaging";
const serviceAccount = {
  type: "service_account",
  project_id: "nam-28831",
  private_key_id: "e528cde82f543c190318caf8c996998da4698a87",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDO7ESvKUZI6afH\nVTqHbD8TZ6uRwpEpofZsuOD8VSxzn8PSGrUhPaYPCC8TlBtUrXgQfQNJ2/0KipBR\nfoS9RWPV7GYvVWIEei6jh/ND1ehA/tjaF9dN6UlRAaM0AerLMthsMrsp3HyWuCz2\n7hwJNB5Ufe9KB/oaU6uo+994blNptzTUrmAOS2muQhW6AqYTrX8gLI/mclvBWu+f\nBqHJU5THQJNwXm2bhVnPi/n3jKoFSfu8YNM8DWARAq2Yfrnpod12+zSI+/D8tDXa\neniQ+ZZpwG8iCHJZ5sncL4Ge4Ze43nwB6lPYG3GC1MozlvY4uJXIgrQvJoOfAVfE\nvV+D8ZPrAgMBAAECggEAGChJnSt+laJAYLX+DHO3lMk3JLVoOMnnA5Vn9X2aIBuT\nAyieud/rzvh1H94xfKbN4XA+3d9tgM621OomOWnsTbwjcpDkzcICnOaRINEhztNn\nN2WuJgiUyHzI9Bg/NEmI2Ro+cz+Br3TsEZ4F2ZCN8+5J7UTWJD8IHO/e4ef7cVgT\noqtxh//pXtUTFRmTw3NhGnQ5xwpqJTKMCvocofD4kNBq2BDdMW4JG7mGMDajmyY1\nSwf67s3ckbPFTDvNsWyrG85Z7wSrwfae2ctbElT+YKUjWitt6O2JaSbI5LsfL8b6\ncQn3Xis98sc5L9SY1NvXAP1uPUWgDEQ4ctZRAP1zIQKBgQDorVDe/XPtTU94eMas\nhaninTDuvsuqDh2907CR5Imy48/Jy9vC9BsoHFGDo2uOWVgK3agYbGU26R67sXeo\n/ZzLgxou3oBCg34XDuZKeR+0/XKBPMyEQmdud083X/KYfSTqoX1IQRsZUKQuwma7\n80GAKhW88gYkDQFeHSumFwlPCwKBgQDjqhTGP+jEI9Y3T4s1zswIxKEo8GpHHOg5\nGUMxchfraLxsAiCOanp56ZyIhyYa51L+/5dpUWUvjjUpNFHpIEVFa0AuuXVFPwTr\nZ7az+Q426V+Z7O0CRbYvVV3wIoENvE1Wa+IWeekjBgYdkVmEILz9iLrOUTkccEUW\nsH5wyAdaoQKBgQCS6mSm+HhLfUZRtkkURC251jFAfp6QmOs0okbaR+ieWPQp4hu4\nJHRFRmQ972EJd+Z8rermyQK7wkTSlMMOpFxtsDFHKNzpoqdqHdFRctuPZ3z2l5I3\nbMpsWM9fEqlWmaZGtIMrrVhUCrQwhjViNb3FFE23iUZRWxji+R5HeEI7cwKBgQCN\nd9644nWti+dNL2x93ycCO805N0uTLO9Qq9YJH7ClY8vSAfBhDuFUaEoQvIp9JUl5\nkzFvDFkoF+II3K4ZgygIXwDfB/dLNEHGVgg+BYFDtfjmGUedpdvzxcQ9t/MhqeUU\n0q0G8nJghRm/vdY2OHG3ygLquaYXedw0oS+wvVt0gQKBgDDV57oBnwdPWs78ZHRJ\nJuEje4FTj62jabXpNnmmizHKEZWaUWvkvEuPf9EGJN/P1kvPhd3ZC0iPvHuscdJ+\n/bK6IvBuLS9egxoBgIZ/T3p0tZW2QMfba/4bEzj3iCEmVIfrui1g3VZW1+JMOiS9\nRxUSBapeCUL4cvXdRMb9ea6F\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@nam-28831.iam.gserviceaccount.com",
  client_id: "113075105328949396604",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40nam-28831.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};
import { createClient } from "npm:@supabase/supabase-js@2";
const app = initializeApp({
  credential: cert(serviceAccount),
});
const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);
Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    // Validate payload
    if (!payload.employee_ids || !Array.isArray(payload.employee_ids)) {
      return new Response(
        JSON.stringify({
          error: "employee_ids is required and must be an array",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const {
      employee_ids,
      notification_type,
      title,
      body,
      priority = "normal",
      metadata = {},
      action_url,
      action_label,
      icon,
      image_url,
      created_by,
    } = payload;

    // 1. Create notifications in database
    const notificationRecords = employee_ids.map((employee_id) => ({
      employee_id,
      notification_type: notification_type || "other",
      title,
      body,
      priority,
      metadata,
      action_url,
      action_label,
      icon,
      image_url,
      created_by,
      is_read: false,
      sent_to_fcm: false,
    }));

    const { data: createdNotifications, error: insertError } = await supabase
      .from("notifications")
      .insert(notificationRecords)
      .select();

    if (insertError) {
      console.error("Error creating notifications:", insertError);
      throw insertError;
    }

    // 2. Get FCM tokens for these employees
    const { data: tokens, error: tokensError } = await supabase
      .from("employee_fcm_tokens")
      .select("fcm_token, employee_id")
      .in("employee_id", employee_ids)
      .eq("is_active", true);

    if (tokensError) {
      console.error("Error fetching FCM tokens:", tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log("No active FCM tokens found for employees:", employee_ids);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notifications created but no FCM tokens found",
          notifications_created: createdNotifications.length,
          fcm_sent: 0,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Prepare FCM message
    const fcmTokens = tokens.map((t) => t.fcm_token);
    const payloadMessage = {
      notification: {
        title: title,
        body: body,
        ...(icon && { icon: icon }),
        ...(image_url && { image: image_url }),
      },
      data: {
        notification_type: notification_type || "other",
        priority: priority,
        ...(action_url && { link: action_url }),
        ...(action_label && { action_label: action_label }),
        ...Object.keys(metadata).reduce((acc, key) => {
          acc[key] =
            typeof metadata[key] === "string"
              ? metadata[key]
              : JSON.stringify(metadata[key]);
          return acc;
        }, {}),
      },
      tokens: fcmTokens,
    };

    // 4. Send FCM notifications
    let successCount = 0;
    let failureCount = 0;
    const notificationIds = createdNotifications.map((n) => n.id);

    try {
      const response =
        await getMessaging().sendEachForMulticast(payloadMessage);
      successCount = response.successCount;
      failureCount = response.failureCount;

      console.log("FCM sent:", { successCount, failureCount });

      // Handle failed tokens (optional - mark as inactive)
      if (response.responses) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(fcmTokens[idx]);
            console.error("Failed to send to token:", resp.error);
          }
        });

        // Mark failed tokens as inactive
        if (failedTokens.length > 0) {
          await supabase
            .from("employee_fcm_tokens")
            .update({ is_active: false })
            .in("fcm_token", failedTokens);
        }
      }
    } catch (fcmError) {
      console.error("Error sending FCM:", fcmError);
      // Continue even if FCM fails - notifications are already in DB
    }

    // 5. Update notifications as sent to FCM
    if (successCount > 0) {
      await supabase
        .from("notifications")
        .update({
          sent_to_fcm: true,
          fcm_sent_at: new Date().toISOString(),
        })
        .in("id", notificationIds);
    }

    // 6. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: createdNotifications.length,
        fcm_tokens_found: tokens.length,
        fcm_sent_success: successCount,
        fcm_sent_failed: failureCount,
        notification_ids: notificationIds,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in push-notification function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
