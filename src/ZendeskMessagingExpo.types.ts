export interface ZendeskUser {
  id: string;
  externalId: string;
}

export interface ZendeskInitializeConfig {
  channelKey: string;
  skipOpenMessaging?: boolean;
}

export type ZendeskEventType = keyof ZendeskEventResponse;
export type ZendeskEvent<Type extends ZendeskEventType> =
  ZendeskEventResponse[Type];

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- allow type
type ZendeskEventResponse = {
  unreadMessageCountChanged: {
    unreadCount: number;
  };
  authenticationFailed: {
    reason: string;
  };
  fieldValidationFailed: {
    errors: Array<string>
  };
  connectionStatusChanged: {
    connectionStatus: ZendeskConnectionStatus
  };
  sendMessageFailed: {
    cause: string;
  };
  conversationAdded: {
    conversationId: string
  }
  onNotificationReceived: {
    reason: string;
  };
};

type ZendeskConnectionStatus =
  | "connected"
  | "connectedRealtime"
  | "connectingRealtime"
  | "disconnected"

export type EmitterSubscription = {
  remove: () => void; // The remove method to unsubscribe from the event
};

export type ZendeskNotificationResponsibility =
  | 'MESSAGING_SHOULD_DISPLAY'
  | 'MESSAGING_SHOULD_NOT_DISPLAY'
  | 'NOT_FROM_MESSAGING'
  | 'UNKNOWN';
