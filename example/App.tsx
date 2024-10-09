import { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import * as ZendeskMessagingExpo from "zendesk-messaging-expo";

export default function App() {
  useEffect(() => {
    async function initZendesk() {
      try {
        const zendeskChannelKey =
          Platform.OS === "ios"
            ? process.env.EXPO_ZENDESK_IOS_CHANNEL_KEY || "IOS_CHANNEL_KEY"
            : process.env.EXPO_ZENDESK_ANDROID_CHANNEL_KEY ||
              "ANDROID_CHANNEL_KEY";
        await ZendeskMessagingExpo.initialize(zendeskChannelKey);
        console.log("Zendesk initialized");
        //fetch JWT from your backend - in production make sure you authenticate the user
        const zendeskJwtUrl =
          process.env.EXPO_ZENDESK_JWT_URL ||
          "https://EXAMPLE_BACKEND?email=test-user@example.com";
        const response = await fetch(zendeskJwtUrl);
        const jwt = await response.text();
        const zendeskUser = await ZendeskMessagingExpo.loginUser(jwt);
        console.log("Logged in Zendesk user", zendeskUser);

        ZendeskMessagingExpo.openMessagingView();
      } catch (e) {
        console.log(e);
      }
    }
    initZendesk();
  });

  return (
    <View style={styles.container}>
      <Text>{ZendeskMessagingExpo.hello()}</Text>
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
});
