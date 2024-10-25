// Import the native module. On web, it will be resolved to ZendeskMessagingExpo.web.ts
// and on native platforms to ZendeskMessagingExpo.ts
import { EventEmitter, Platform, Subscription } from 'expo-modules-core';
import { ZendeskEvent, ZendeskEventType, ZendeskInitializeConfig, ZendeskUser, EmitterSubscription, ZendeskNotificationResponsibility } from "./ZendeskMessagingExpo.types";
import ZendeskMessagingExpoModule from "./ZendeskMessagingExpoModule";


/**
 * Initializing Zendesk SDK.
 *
 * You should call this function first before using other features.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/getting_started/#initialize-the-sdk}
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/getting_started/#initialize-the-sdk}
 */
export async function initialize(config: ZendeskInitializeConfig) {
  return ZendeskMessagingExpoModule.initialize({skipOpenMessaging: false, ...config});
}

/**
 * Invalidates the current instance of Zendesk.
 *
 * After calling this method you will have to call `initialize` again if you would like to use Zendesk.
 */
export function reset(): void {
  return ZendeskMessagingExpoModule.reset();
}

/**
 * To authenticate a user call the `login` with your own JWT.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/advanced_integration/#loginuser}
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/advanced_integration/#loginuser}
 */
export async function loginUser(token: string): Promise<ZendeskUser> {
  if (typeof token !== "string" || !token.length) {
    return Promise.reject(new Error("invalid token"));
  }
  return ZendeskMessagingExpoModule.loginUser(token);
}

/**
 * Logout from Zendesk SDK.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/advanced_integration/#logoutuser}
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/advanced_integration/#logoutuser}
 */
export function logout(): Promise<void> {
  return ZendeskMessagingExpoModule.logoutUser();
}


/**
 * Show the native based conversation screen.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/getting_started/#show-the-conversation}
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/getting_started/#show-the-conversation}
 */
export async function openMessagingView(): Promise<void> {
  return ZendeskMessagingExpoModule.openMessagingView();
}

export async function setValueAsync(value: string) {
  return await ZendeskMessagingExpoModule.setValueAsync(value);
}

export function getUnreadMessageCount(): Promise<number> {
  return ZendeskMessagingExpoModule.getUnreadMessageCount();
}

const eventEmitter = new EventEmitter(ZendeskMessagingExpoModule);

/**
 * Add a listener for listening emitted events by Zendesk SDK.
 */
export function addEventListener<EventType extends ZendeskEventType>(
  type: EventType,
  listener: (event: ZendeskEvent<EventType>) => void
): EmitterSubscription {
  return eventEmitter.addListener(type, listener);
}

/**
 * Remove subscribed event listener.
 */
export function removeSubscription(subscription: EmitterSubscription): void {
  eventEmitter.removeSubscription(subscription);
}

/**
 * Remove all of registered listener by event type.
 */
export function removeAllListeners(type: ZendeskEventType): void {
  eventEmitter.removeAllListeners(type);
}

/**
 * **Android Only** (no-op for other platform)
 *
 * Set push notification token(FCM).
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/push_notifications/#updating-push-notification-tokens}
 */
export function updatePushNotificationToken(token: string): void {
  if (Platform.OS !== 'android') return;
  return ZendeskMessagingExpoModule.updatePushNotificationToken(token);
}

/**
 * **Android Only** (no-op for other platform, always return `UNKNOWN`)
 *
 * Handle remote message that received from FCM(Firebase Cloud Messaging) and show notifications.
 * If remote message isn't Zendesk message, it does nothing.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/push_notifications/#using-a-custom-implementation-of-firebasemessagingservice}
 */
export function handleNotification(
  remoteMessage: Record<string, string>
): Promise<ZendeskNotificationResponsibility> {
  return ZendeskMessagingExpoModule.handleNotification(remoteMessage)
}

export function registerPushToken(token: string): Promise<ZendeskNotificationResponsibility> {
  return ZendeskMessagingExpoModule.updatePushNotificationToken(token)
}