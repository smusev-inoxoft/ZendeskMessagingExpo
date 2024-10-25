import ExpoModulesCore
import ZendeskSDK
import ZendeskSDKMessaging

public class ZendeskMessagingExpoModule: Module {
  private var zendeskInstance: Zendesk?
  private var receivedUserInfo: [AnyHashable: Any]?

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ZendeskMessagingExpo')` in JavaScript.
    Name("ZendeskMessagingExpo")

    Events(
      "unreadMessageCountChanged", "authenticationFailed", "connectionStatusChanged",
      "sendMessageFailed", "conversationAdded")

    AsyncFunction("initialize") { (config: [String: Any]) in
      return try await withCheckedThrowingContinuation {
        (continuation: CheckedContinuation<Bool, Error>) in
        let channelKey = confighandleIncomingNotification["channelKey"] as! String
        let skipOpenMessaging = config["skipOpenMessaging"] as! Bool

        self.initialize(withChannelKey: channelKey) { result in
          switch result {
          case .success(let zendesk):
            self.zendeskInstance = zendesk
            if !skipOpenMessaging {
              self.openMessageViewByPushNotification()
            }
            self.setupEventObserver(withInstance: zendesk)
            continuation.resume(returning: true)
          case .failure(let error):
            continuation.resume(throwing: error)
          }
        }
      }
    }

    // Define the async reset function
    AsyncFunction("reset") { (promise: Promise) in
      self.reset()
      promise.resolve("Zendesk has been reset successfully")
    }

    AsyncFunction("updatePushNotificationToken") { (token: String) in
      if let tokenData = hexStringToData(hexString: token) {
        PushNotifications.updatePushNotificationToken(tokenData)
      } else {
        print("Failed to convert token string to Data")
      }
    }

    AsyncFunction("handleNotification") { (userInfo: [AnyHashable: Any], promise: Promise) in
      let shouldBeDisplayed = PushNotifications.shouldBeDisplayed(userInfo)

      switch shouldBeDisplayed {
      case .messagingShouldDisplay:
        promise.resolve("MESSAGING_SHOULD_DISPLAY")
      case .messagingShouldNotDisplay:
        promise.resolve("MESSAGING_SHOULD_NOT_DISPLAY")
      case .notFromMessaging:
        promise.resolve("NOT_FROM_MESSAGING")
      @unknown default: break
      }
    }

    AsyncFunction("handleNotificationClick") { (userInfo: [AnyHashable: Any]) in
      self.openMessageViewByPushNotification(userInfo)
    }

    AsyncFunction("getUnreadMessageCount") { (promise: Promise) in
      let count = self.getUnreadMessageCount()
      promise.resolve(count)
    }

    AsyncFunction("loginUser") { (token: String, promise: Promise) in
      do {
        // Call the loginUser method of the Zendesk SDK
        self.loginUser(token) { result in
          switch result {
          case .success(let zendeskUser):
            // Create a dictionary with user information
            let userMap: [String: Any] = [
              "id": zendeskUser.id,
              "externalId": zendeskUser.externalId,
            ]
            promise.resolve(userMap)  // Resolve the promise with user information
          case .failure(let error):
            // Handle the error case
            promise.reject(
              "ZendeskInitError", "Zendesk initialization failed: \(error.localizedDescription)")
          }
        }
      }
    }

    AsyncFunction("logoutUser") { (promise: Promise) in
      Task {
        do {
          try await withCheckedThrowingContinuation { continuation in
            self.logoutUser { result in
              switch result {
              case .success:
                continuation.resume(returning: ())
              case .failure(let error):
                continuation.resume(throwing: error)
              }
            }
          }
          promise.resolve(nil)  // Resolve promise if logout was successful
        } catch {
          promise.reject("LogoutUserError", "Failed to logout user: \(error.localizedDescription)")
        }
      }
    }

    AsyncFunction("openMessagingView") { (promise: Promise) in
      self.openMessagingView(
        resolver: promise.resolve,
        rejecter: { (code: String?, message: String?, error: Error?) in
          // Unwrap message and code safely, providing default values if necessary
          let errorCode = code ?? "UnknownError"
          let errorMessage = message ?? "An unknown error occurred"
          promise.reject(errorCode, errorMessage)
        })
    }

  }

  private func openMessagingView(
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let viewController = self.getMessagingViewController() else {
        reject("MessagingViewError", "Cannot get messaging view controller", nil)
        return
      }

      guard let rootController = RCTPresentedViewController() else {
        reject("RootControllerError", "No root view controller available", nil)
        return
      }

      rootController.present(viewController, animated: true) {
        resolve("Messaging view opened successfully")
      }
    }
  }

  private func initialize(
    withChannelKey channelKey: String,
    messagingFactory: ZendeskSDK.MessagingFactory? = nil,
    completionHandler: @escaping (Result<ZendeskSDK.Zendesk, Error>) -> Void
  ) {
    Zendesk.initialize(
      withChannelKey: channelKey,
      messagingFactory: DefaultMessagingFactory(),
      completionHandler: completionHandler
    )
  }

  private func loginUser(
    _ token: String,
    completionHandler: ((Result<ZendeskSDK.ZendeskUser, Error>) -> Void)? = nil
  ) {
    Zendesk.instance?.loginUser(with: token, completionHandler: completionHandler)
  }

  private func logoutUser(
    _ completionHandler: ((Result<Void, Error>) -> Void)? = nil
  ) {
    Zendesk.instance?.logoutUser(completionHandler: completionHandler)
  }

  private func getMessagingViewController() -> UIViewController? {
    guard let messagingVC = Zendesk.instance?.messaging?.messagingViewController() else {
      return nil
    }
    return messagingVC
  }

  private func reset() {
    Zendesk.invalidate()
  }

  private func getUnreadMessageCount() -> Int? {
    return Zendesk.instance?.messaging?.getUnreadMessageCount()
  }

  private func setupEventObserver(withInstance zendeskInstance: Zendesk) {
    // Observe events from the Zendesk instance
    Zendesk.instance?.addEventObserver(self) { [weak self] event in
      guard let self = self else { return }

      // Emit events only if there are listeners
      switch event {
      case .unreadMessageCountChanged(let unreadCount):
        self.sendEvent(
          "unreadMessageCountChanged",
          [
            "unreadCount": unreadCount
          ])
      case .authenticationFailed(let error):
        self.sendEvent(
          "authenticationFailed",
          [
            "reason": error.localizedDescription
          ])
      case .connectionStatusChanged(let connectionStatus):
        self.sendEvent(
          "connectionStatusChanged",
          [
            "connectionStatus": connectionStatus
          ])
      case .sendMessageFailed(let cause):
        self.sendEvent(
          "sendMessageFailed",
          [
            "cause": cause
          ])
      case .conversationAdded(let conversationId):
        self.sendEvent(
          "conversationAdded",
          [
            "conversationId": conversationId
          ])
      @unknown default:
        break
      }
    }
  }

  private func hexStringToData(hexString: String) -> Data? {
    var data = Data()
    let hex = hexString

    for i in stride(from: 0, to: hex.count, by: 2) {
      let startIndex = hex.index(hex.startIndex, offsetBy: i)
      let endIndex = hex.index(startIndex, offsetBy: 2)
      let byteString = hex[startIndex..<endIndex]
      if let byte = UInt8(byteString, radix: 16) {
        data.append(byte)
      } else {
        return nil
      }
    }
    return data
  }

  private func openMessageViewByPushNotification(
    _ userInfo: [AnyHashable: Any]? = nil
  ) {
    guard let userInfo = userInfo else {
      return
    }

    PushNotifications.handleTap(userInfo) { viewController in
      self.receivedUserInfo = nil
      guard let rootController = RCTPresentedViewController(),
        let viewController = viewController
      else {
        return
      }
      rootController.show(viewController, sender: self)
    }
  }

}
