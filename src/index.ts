// Import the native module. On web, it will be resolved to ZendeskMessagingExpo.web.ts
// and on native platforms to ZendeskMessagingExpo.ts
import { ZendeskUser } from "./ZendeskMessagingExpo.types";
import ZendeskMessagingExpoModule from "./ZendeskMessagingExpoModule";

// Get the native constant value.
export const PI = ZendeskMessagingExpoModule.PI;

export function hello(): string {
  return ZendeskMessagingExpoModule.hello();
}

/**
 * Initializing Zendesk SDK.
 *
 * You should call this function first before using other features.
 *
 * @see Android {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/android/getting_started/#initialize-the-sdk}
 * @see iOS {@link https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/ios/getting_started/#initialize-the-sdk}
 */
export async function initialize(channelKey: string) {
  return ZendeskMessagingExpoModule.initialize(channelKey);
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
  return ZendeskMessagingExpoModule.login(token);
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
