import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface NotificationCallback {
  (payload: any): void;
}

interface NotificationOptions {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  callback: NotificationCallback;
}

class NotificationService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, NotificationOptions> = new Map();

  /**
   * Subscribe to realtime changes on a table
   * @param channelName Unique name for this subscription
   * @param options Subscription options
   * @returns Unsubscribe function
   */
  subscribe(channelName: string, options: NotificationOptions): () => void {
    // If already subscribed, unsubscribe first
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    // Create channel
    const channel = supabase.channel(channelName);

    // Setup subscription based on options
    let subscription = channel.on(
      "postgres_changes" as any,
      {
        event: options.event || "*",
        schema: "public",
        table: options.table,
        filter: options.filter,
      },
      (payload) => {
        console.log(
          `[NotificationService] Received ${options.event || "*"} on ${
            options.table
          }:`,
          payload
        );
        options.callback(payload);
      }
    );

    // Subscribe to the channel
    subscription.subscribe((status) => {
      console.log(
        `[NotificationService] Channel ${channelName} status:`,
        status
      );
    });

    // Store references
    this.channels.set(channelName, channel);
    this.subscriptions.set(channelName, options);

    // Return unsubscribe function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe specifically to B2B quotes table changes
   * @param callback Function to call when quotes change
   * @param employeeId Optional filter by employee ID
   * @returns Unsubscribe function
   */
  subscribeToB2BQuotes(
    callback: NotificationCallback,
    employeeId?: string
  ): () => void {
    const channelName = `b2b_quotes_${employeeId || "all"}`;

    return this.subscribe(channelName, {
      table: "b2b_quotes",
      event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
      filter: employeeId
        ? `created_by_employee_id=eq.${employeeId}`
        : undefined,
      callback: (payload) => {
        // Add additional processing for B2B quotes
        const processedPayload = {
          ...payload,
          timestamp: new Date().toISOString(),
          table: "b2b_quotes",
        };
        callback(processedPayload);
      },
    });
  }

  /**
   * Subscribe specifically to B2B quote items table changes
   * @param callback Function to call when quote items change
   * @param quoteId Optional filter by quote ID
   * @returns Unsubscribe function
   */
  subscribeToB2BQuoteItems(
    callback: NotificationCallback,
    quoteId?: string
  ): () => void {
    const channelName = `b2b_quote_items_${quoteId || "all"}`;

    return this.subscribe(channelName, {
      table: "b2b_quote_items",
      event: "*",
      filter: quoteId ? `quote_id=eq.${quoteId}` : undefined,
      callback: (payload) => {
        const processedPayload = {
          ...payload,
          timestamp: new Date().toISOString(),
          table: "b2b_quote_items",
        };
        callback(processedPayload);
      },
    });
  }

  /**
   * Unsubscribe from a specific channel
   * @param channelName Name of the channel to unsubscribe from
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.subscriptions.delete(channelName);
      console.log(`[NotificationService] Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`[NotificationService] Unsubscribed from ${channelName}`);
    });
    this.channels.clear();
    this.subscriptions.clear();
  }

  /**
   * Get list of active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if a specific channel is subscribed
   */
  isSubscribed(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();

// Export types for use in other files
export type { NotificationCallback, NotificationOptions };
