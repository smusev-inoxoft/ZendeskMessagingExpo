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

type ZendeskEventResponse = {
  unreadMessageCountChanged: {
    unreadCount: number;
  };
  authenticationFailed: {
    reason: string;
  };
  fieldValidationFailed: {
    errors: string[];
  };
  connectionStatusChanged: {
    connectionStatus: ZendeskConnectionStatus;
  };
  sendMessageFailed: {
    cause: string;
  };
  conversationAdded: {
    conversationId: string;
  };
  onNotificationReceived: {
    reason: string;
  };
};

type ZendeskConnectionStatus =
  | "connected"
  | "connectedRealtime"
  | "connectingRealtime"
  | "disconnected";

export type ZendeskNotificationResponsibility =
  | "MESSAGING_SHOULD_DISPLAY"
  | "MESSAGING_SHOULD_NOT_DISPLAY"
  | "NOT_FROM_MESSAGING"
  | "UNKNOWN";
