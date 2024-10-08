import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import * as ZendeskMessagingExpo from "zendesk-messaging-expo";

export default function App() {
  useEffect(() => {
    async function initZendesk() {
      try {
        await ZendeskMessagingExpo.initialize("KEY");
        ZendeskMessagingExpo.openMessagingView();
        console.log("Zendesk initialized");
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
