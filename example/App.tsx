import { useEffect, useRef, useState } from "react";
import { Alert, Button, Platform, StyleSheet, Text, View } from "react-native";
import * as ZendeskMessagingExpo from "zendesk-messaging-expo";
import * as Notifications from 'expo-notifications';

// ::::: REMOVE IT :::::
const ANDROID_CHANNEL_KEY = 'eyJzZXR0aW5nc191cmwiOiJodHRwczovL2lub3hvZnR6ZW5kZXNrdHJpYWwuemVuZGVzay5jb20vbW9iaWxlX3Nka19hcGkvc2V0dGluZ3MvMDFKQUE5VDIzRkFWQkJZV0VQRzBONVcxU1MuanNvbiJ9'
const IOS_CHANNEL_KEY = 'eyJzZXR0aW5nc191cmwiOiJodHRwczovL2lub3hvZnR6ZW5kZXNrdHJpYWwuemVuZGVzay5jb20vbW9iaWxlX3Nka19hcGkvc2V0dGluZ3MvMDFKQUE5V1lUMk1IU1o4RFJNUEo3Vk4yWTMuanNvbiJ9'
const JWT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImtpZCI6ImFwcF82NzBmOTIyYzFmYzFjM2U5YzI2N2E4ODQifQ.eyJzY29wZSI6InVzZXIiLCJleHRlcm5hbF9pZCI6IjEyMzQ1In0.Yw8rHe-dOmwAS33YdHiFjNw7P7kXH4GrR1msouNhPrI'

type AppStatus = {
  isInitialized: boolean;
  statusMessage: string;
  unreadCount?: number;
}

export default function App() {
  const [appStatus, setAppStatus] = useState<AppStatus>({ isInitialized: false, statusMessage: '' })
  const notificationListener = useRef()
  
  useEffect(() => {
    handleInit();
    ZendeskMessagingExpo.addEventListener('unreadMessageCountChanged', e => setAppStatus(prev => { return { ...prev, unreadCount: e.unreadCount } }))
    ZendeskMessagingExpo.addEventListener('authenticationFailed', e => setAppStatus({ isInitialized: false, statusMessage: 'authenticationFailed' }))
    // ZendeskMessagingExpo.addEventListener('onNotificationReceived', e => console.log('onNotificationReceived', e))
    ZendeskMessagingExpo.getUnreadMessageCount().then(res => console.log('UNREAD COUNT : ', res))
    requestNotificationPermissions()
    
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
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        }
      },
    });
  }, []);

  const handleInit = async () => {
    try {
      const zendeskChannelKey =
        Platform.OS === "ios"
          ? process.env.EXPO_ZENDESK_IOS_CHANNEL_KEY || IOS_CHANNEL_KEY
          : process.env.EXPO_ZENDESK_ANDROID_CHANNEL_KEY ||
          ANDROID_CHANNEL_KEY;
      await ZendeskMessagingExpo.initialize({ channelKey: zendeskChannelKey, skipOpenMessaging: false });
      console.log("Zendesk initialized");
      setAppStatus({ isInitialized: true, statusMessage: 'Zendesk initialized' })
      //fetch JWT from your backend - in production make sure you authenticate the user
      // const zendeskJwtUrl =
      //   process.env.EXPO_ZENDESK_JWT_URL ||
      //   "https://EXAMPLE_BACKEND?email=test-user@example.com";
      // const response = await fetch(zendeskJwtUrl);
      // const jwt = await response.text();
      const zendeskUser = await ZendeskMessagingExpo.loginUser(JWT_TOKEN);
      console.log("Logged in Zendesk user", zendeskUser);

      ZendeskMessagingExpo.openMessagingView();
    } catch (e) {
      setAppStatus({ isInitialized: false, statusMessage: 'Zendesk error: \n' + e })
    }
  }

  const handleReset = () => {
    try {
      ZendeskMessagingExpo.reset()
      setAppStatus({ isInitialized: false, statusMessage: 'Zendesk invalidated' })
    } catch (e) {
      setAppStatus({ isInitialized: false, statusMessage: 'Zendesk error: \n' + e })
    }
  }

  async function requestNotificationPermissions() {
    console.log('requestNotificationPermissions ::::')

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    console.log('get token :::::')

    // Get the token
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    console.log('token :::::', token)


    // Register the token with your Expo module
    // Assuming you have the registerPushToken function in your module
    ZendeskMessagingExpo.registerPushToken(token)
      .then(() => console.log('Push token registered successfully'))
      .catch(err => console.error('Error registering push token:', err));
  }


  async function handleZendeskNotification(notification: any) {
    console.log(JSON.stringify(notification, null, 2))
    Alert.alert('', JSON.stringify(notification, null, 2))
    const userInfo = notification.request.content.data;
    // Your custom logic for checking if the notification is handled by Zendesk
    const isHandledByZendesk = await ZendeskMessagingExpo.handleNotification(userInfo);
    return isHandledByZendesk;
  }

  const handleLogout = () => {
    try {
      ZendeskMessagingExpo.logout()
      setAppStatus({ isInitialized: false, statusMessage: 'user logout' })
    } catch (e) {
      setAppStatus({ isInitialized: false, statusMessage: 'Zendesk error: \n' + e })
    }
  }

  return (
    <View style={styles.container}>
      <Text>{ZendeskMessagingExpo.hello()}</Text>
      <Text>{appStatus.statusMessage}</Text>
      {appStatus.isInitialized
        ? <Button title="reset" onPress={handleReset}></Button>
        : <Button title="initialize" onPress={handleInit}></Button>
      }
      <View style={{ marginTop: 100 }}>

        <Button
          color={'lightblue'}
          title="open view"
          onPress={ZendeskMessagingExpo.openMessagingView}
        // disabled={!appStatus.isInitialized}
        />
        {!!appStatus.unreadCount &&
          <View style={{
            backgroundColor: 'darkred',
            height: 24,
            width: 24,
            borderRadius: 24,
            position: 'absolute',
            right: -12,
            top: -10,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: 'white' }} >{appStatus.unreadCount}</Text>
          </View>}
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
});
