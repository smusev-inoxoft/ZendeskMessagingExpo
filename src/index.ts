import { EventEmitter, Platform, Subscription } from "expo-modules-core";

import {
  ZendeskEvent,
  ZendeskEventType,
  ZendeskInitializeConfig,
  ZendeskNotificationResponsibility,
  ZendeskUser,
} from "./ZendeskMessaging.types";
import ZendeskMessagingModule from "./ZendeskMessagingModule";

const eventEmitter = new EventEmitter(ZendeskMessagingModule);

/**
 * Initializes Zendesk SDK.
 *
 * You should call this function first before using other features.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/getting_started/#initialize-the-sdk}
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/getting_started/#initialize-the-sdk}
 */
export function initialize(config: ZendeskInitializeConfig): Promise<void> {
  return ZendeskMessagingModule.initialize({
    skipOpenMessaging: false,
    ...config,
  });
}

/**
 * Invalidates the current instance of Zendesk.
 *
 * After calling this method you will have to call `initialize` again if you would like to use Zendesk.
 */
export function reset(): Promise<void> {
  return ZendeskMessagingModule.reset();
}

/**
 * To authenticate a user call the `login` with your own JWT.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/advanced_integration/#loginuser}
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/advanced_integration/#loginuser}
 */
export async function loginUser(jwtToken: string): Promise<ZendeskUser> {
  if (jwtToken.length === 0) {
    throw new Error("invalid token");
  }

  return ZendeskMessagingModule.loginUser(jwtToken);
}

/**
 * Logout from Zendesk SDK.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/advanced_integration/#logoutuser}
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/advanced_integration/#logoutuser}
 */
export function logout(): Promise<void> {
  return ZendeskMessagingModule.logoutUser();
}

/**
 * Show the native based conversation screen.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/getting_started/#show-the-conversation}
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/getting_started/#show-the-conversation}
 */
export async function openMessagingView(): Promise<void> {
  return ZendeskMessagingModule.openMessagingView();
}

/** Unread counter for current user */
export function getUnreadMessageCount(): Promise<number> {
  return ZendeskMessagingModule.getUnreadMessageCount();
}

/**
 * Add a listener for listening emitted events by Zendesk SDK.
 */
export function addEventListener<EventType extends ZendeskEventType>(
  type: EventType,
  listener: (event: ZendeskEvent<EventType>) => void
): Subscription {
  return eventEmitter.addListener(type, listener);
}

/**
 * Remove subscribed event listener.
 */
export function removeSubscription(subscription: Subscription): void {
  eventEmitter.removeSubscription(subscription);
}

/**
 * Remove all of registered listener by event type.
 */
export function removeAllListeners(type: ZendeskEventType): void {
  eventEmitter.removeAllListeners(type);
}

/**
 * Set push notification token.
 *
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/push_notifications/#step-6---add-the-zendesk-sdk-to-your-app}
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/push_notifications/#updating-push-notification-tokens}
 */
export async function updatePushNotificationToken(
  token: string
): Promise<void> {
  return ZendeskMessagingModule.updatePushNotificationToken(token);
}

/**
 * Handle incoming remote message and show notification.
 * If remote message isn't Zendesk message, it does nothing.
 */
export function handleNotification(
  remoteMessage: Record<string, string>
): Promise<ZendeskNotificationResponsibility> {
  return ZendeskMessagingModule.handleNotification(remoteMessage);
}

/**
 * Handles click event on a notification.
 * Does nothing on Android.
 */
export async function handleNotificationClick(
  remoteMessage: Record<string, string>
): Promise<void> {
  if (Platform.OS === "android") return;
  return ZendeskMessagingModule.handleNotificationClick(remoteMessage);
}
