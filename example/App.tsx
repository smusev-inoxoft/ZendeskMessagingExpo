import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Button, Platform, StyleSheet, Text, View } from "react-native";
import * as ZendeskMessaging from "zendesk-messaging-expo";

export default function App() {
  const [isInitialized, setInitialized] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(10);

  const initializeZendesk = async () => {
    try {
      const zendeskChannelKey =
        Platform.OS === "ios"
          ? process.env.EXPO_PUBLIC_ZENDESK_IOS_CHANNEL_KEY
          : process.env.EXPO_PUBLIC_ZENDESK_ANDROID_CHANNEL_KEY;

      if (!zendeskChannelKey) {
        throw new Error(
          "Missing channel key. Make sure to set it in .env file"
        );
      }

      await ZendeskMessaging.initialize({
        channelKey: zendeskChannelKey,
        skipOpenMessaging: false,
      });

      setInitialized(true);
      setStatusMessage("Zendesk initialized");

      ZendeskMessaging.openMessagingView();
    } catch (error) {
      setInitialized(false);
      setStatusMessage(`Zendesk error:\n${error}`);
    }
  };

  const handleOpenMessagingPress = async () => {
    try {
      await ZendeskMessaging.openMessagingView();
    } catch (e) {
      setStatusMessage(`Zendesk error:\n${e}`);
    }
  };

  const handleLogoutPress = async () => {
    try {
      await ZendeskMessaging.logout();
      setStatusMessage("User is logged out");
    } catch (e) {
      setStatusMessage(`Zendesk error:\n${e}`);
    } finally {
      setInitialized(false);
    }
  };

  const handleResetPress = async () => {
    try {
      await ZendeskMessaging.reset();
      setStatusMessage("Zendesk has been invalidated");
    } catch (error) {
      setStatusMessage(`Zendesk error:\n${error}`);
    } finally {
      setInitialized(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Missing notification permission");
      }

      const { data: pnsToken } = await Notifications.getDevicePushTokenAsync();
      ZendeskMessaging.updatePushNotificationToken(pnsToken);
    } catch (error) {
      setStatusMessage(`Push notifications error:\n${error}`);
    }
  };

  useEffect(() => {
    initializeZendesk();
    requestNotificationPermission();

    ZendeskMessaging.addEventListener(
      "unreadMessageCountChanged",
      ({ unreadCount }) => setUnreadCount(unreadCount)
    );

    ZendeskMessaging.addEventListener("authenticationFailed", () => {
      setInitialized(false);
      setStatusMessage("Authentication failed");
    });

    ZendeskMessaging.getUnreadMessageCount().then((unreadCount) =>
      setUnreadCount(unreadCount)
    );

    Notifications.addNotificationResponseReceivedListener((response) => {
      const remoteMessage = response.notification.request.content.data;
      ZendeskMessaging.handleNotificationClick(remoteMessage);
    });

    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const responsibility = await ZendeskMessaging.handleNotification(
          notification.request.content.data
        );

        const shouldDisplay = responsibility !== "MESSAGING_SHOULD_NOT_DISPLAY";
        return {
          shouldShowAlert: shouldDisplay,
          shouldPlaySound: shouldDisplay,
          shouldSetBadge: shouldDisplay,
        };
      },
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text>{statusMessage}</Text>
      {isInitialized ? (
        <>
          <Text>You have {unreadCount} unread messages.</Text>
          <Button title="Log out" onPress={handleLogoutPress} />
          <Button title="Reset Zendesk" onPress={handleResetPress} />
        </>
      ) : (
        <Button title="Initialize Zendesk" onPress={initializeZendesk} />
      )}
      <Button title="Open messaging" onPress={handleOpenMessagingPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 16,
    backgroundColor: "white",
  },
});
