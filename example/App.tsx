import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ZendeskMessagingExpo from "zendesk-messaging-expo";
import * as Notifications from "expo-notifications";

type AppStatus = {
  isInitialized: boolean;
  statusMessage: string;
  unreadCount?: number;
};

export default function App() {
  const [appStatus, setAppStatus] = useState<AppStatus>({
    isInitialized: false,
    statusMessage: "",
  });

  useEffect(() => {
    handleInit();
    ZendeskMessagingExpo.addEventListener("unreadMessageCountChanged", (e) =>
      setAppStatus((prev) => {
        return { ...prev, unreadCount: e.unreadCount };
      })
    );
    ZendeskMessagingExpo.addEventListener("authenticationFailed", (e) =>
      setAppStatus({
        isInitialized: false,
        statusMessage: "authenticationFailed",
      })
    );
    ZendeskMessagingExpo.getUnreadMessageCount().then((res) =>
      console.log("UNREAD COUNT : ", res)
    );
    Notifications.addNotificationResponseReceivedListener((response) => {
      const userInfo = response.notification.request.content.data;
      ZendeskMessagingExpo.handleNotificationClick(userInfo);
    });

    requestNotificationPermissions();

    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Here you can integrate your custom logic similar to showNotification from iOS
        const shouldDisplay = await handleZendeskNotification(notification);

        if (shouldDisplay) {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        } else {
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }
      },
    });
  }, []);

  const handleInit = async () => {
    try {
      const zendeskChannelKey =
        Platform.OS === "ios"
          ? process.env.EXPO_ZENDESK_IOS_CHANNEL_KEY || "IOS_CHANNEL_KEY"
          : process.env.EXPO_ZENDESK_ANDROID_CHANNEL_KEY ||
            "ANDROID_CHANNEL_KEY";
      await ZendeskMessagingExpo.initialize({
        channelKey: zendeskChannelKey,
        skipOpenMessaging: false,
      });
      console.log("Zendesk initialized");
      setAppStatus({
        isInitialized: true,
        statusMessage: "Zendesk initialized",
      });
      // fetch JWT from your backend - in production make sure you authenticate the user
      const zendeskJwtUrl =
        process.env.EXPO_ZENDESK_JWT_URL ||
        "https://EXAMPLE_BACKEND?email=test-user@example.com";
      const response = await fetch(zendeskJwtUrl);
      const jwt = await response.text();
      const zendeskUser = await ZendeskMessagingExpo.loginUser(jwt);
      console.log("Logged in Zendesk user", zendeskUser);

      ZendeskMessagingExpo.openMessagingView();
    } catch (e) {
      setAppStatus({
        isInitialized: false,
        statusMessage: "Zendesk error: \n" + e,
      });
    }
  };

  const handleReset = () => {
    try {
      ZendeskMessagingExpo.reset();
      setAppStatus({
        isInitialized: false,
        statusMessage: "Zendesk invalidated",
      });
    } catch (e) {
      setAppStatus({
        isInitialized: false,
        statusMessage: "Zendesk error: \n" + e,
      });
    }
  };

  async function requestNotificationPermissions() {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }

    // Get the token
    const token = (await Notifications.getDevicePushTokenAsync()).data;

    // Register the token with your Expo module
    // Assuming you have the registerPushToken function in your module
    ZendeskMessagingExpo.updatePushNotificationToken(token)
      .then(() => console.log("Push token registered successfully"))
      .catch((err) => console.error("Error registering push token:", err));
  }

  async function handleZendeskNotification(notification: any) {
    const userInfo = notification.request.content.data;
    // Your custom logic for checking if the notification is handled by Zendesk
    const isHandledByZendesk = await ZendeskMessagingExpo.handleNotification(
      userInfo
    );
    return isHandledByZendesk;
  }

  const handleLogout = () => {
    try {
      ZendeskMessagingExpo.logout();
      setAppStatus({ isInitialized: false, statusMessage: "user logout" });
    } catch (e) {
      setAppStatus({
        isInitialized: false,
        statusMessage: "Zendesk error: \n" + e,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text>{appStatus.statusMessage}</Text>
      {appStatus.isInitialized ? (
        <Button title="reset" onPress={handleReset}></Button>
      ) : (
        <Button title="initialize" onPress={handleInit}></Button>
      )}
      <View style={{ marginTop: 100 }}>
        <Button
          color={"lightblue"}
          title="open view"
          onPress={ZendeskMessagingExpo.openMessagingView}
        />
        {!!appStatus.unreadCount && (
          <View style={styles.unreadCounter}>
            <Text style={{ color: "white" }}>{appStatus.unreadCount}</Text>
          </View>
        )}
      </View>
      <Button title="logout" onPress={handleLogout}></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadCounter: {
    backgroundColor: "darkred",
    height: 24,
    width: 24,
    borderRadius: 24,
    position: "absolute",
    right: -12,
    top: -10,
    alignItems: "center",
    justifyContent: "center",
  },
});
