import ExpoModulesCore
import ZendeskSDKMessaging
import ZendeskSDK

public class ZendeskMessagingExpoModule: Module {
  private var zendeskInstance: Zendesk?
  private static var receivedUserInfo: [AnyHashable: Any]?

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ZendeskMessagingExpo')` in JavaScript.
    Name("ZendeskMessagingExpo")

    Events("unreadMessageCountChanged","authenticationFailed","connectionStatusChanged","sendMessageFailed","conversationAdded")
    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants([
      "PI": Double.pi
    ])

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      return "Hello from zendesk ios module! 👋"
    }

    AsyncFunction("initialize") { (channelKey: String) in
            return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Bool, Error>) in
                self.initialize(withChannelKey: channelKey) { result in
                    switch result {
                    case .success(let zendesk):
                        self.zendeskInstance = zendesk
                        self.initializeMessaging()
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
      if let tokenData = Data(base64Encoded: token) {
          // Use the tokenData for Push Notification update
          PushNotifications.updatePushNotificationToken(tokenData)
      } else {
          // Handle the error if conversion fails
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

    AsyncFunction("getUnreadMessageCount") { (promise: Promise) in
        Task {
          do {
            let count = try await self.getUnreadMessageCount()
            promise.resolve(count)
          } catch {
            promise.reject("GetUnreadMessageCountError", "Failed to get unread message count: \(error.localizedDescription)")
          }
        }
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
                            "externalId": zendeskUser.externalId
                        ]
                        promise.resolve(userMap) // Resolve the promise with user information
                    case .failure(let error):
                        // Handle the error case
                        promise.reject("ZendeskInitError", "Zendesk initialization failed: \(error.localizedDescription)") 
                    }
                }
            } catch {
                // Handle unexpected errors
                promise.reject("UnexpectedError", "An unexpected error occurred: \(error.localizedDescription)") 
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
        promise.resolve(nil) // Resolve promise if logout was successful
      } catch {
        promise.reject("LogoutUserError", "Failed to logout user: \(error.localizedDescription)")
      }
    }
  }

    AsyncFunction("openMessagingView") { (promise: Promise) in
      self.openMessagingView(resolver: promise.resolve, rejecter: { (code: String?, message: String?, error: Error?) in
        // Unwrap message and code safely, providing default values if necessary
        let errorCode = code ?? "UnknownError"
        let errorMessage = message ?? "An unknown error occurred"
        promise.reject(errorCode, errorMessage)
      })
    }

  }


  func openMessagingView(
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
  ) -> Void {
    Zendesk.instance?.loginUser(with: token, completionHandler: completionHandler)
  }

    private func logoutUser(
    _ completionHandler: ((Result<Void, Error>) -> Void)? = nil
  ) -> Void {
    Zendesk.instance?.logoutUser(completionHandler: completionHandler)
  }

  private func getMessagingViewController() -> UIViewController? {
    print("Zendesk instance: \(String(describing: Zendesk.instance))")
    print("Messaging: \(String(describing: Zendesk.instance?.messaging))")

      guard let messagingVC = Zendesk.instance?.messaging?.messagingViewController() else {
          print("Messaging view controller is nil")
          return nil
      }
      return messagingVC
  }


  private func initializeMessaging() {
    // Check if Messaging is available
   print("Zendesk.instance is available. \(String(describing: Zendesk.instance))")

    if let messaging = Zendesk.instance?.messaging {
        // Initialize Messaging here if needed
        print("Messaging is available. \(String(describing: Zendesk.instance?.messaging))")
    } else {
        print("Messaging is not available.")
    }
  }

  private func reset() -> Void {
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
                self.sendEvent("unreadMessageCountChanged", [
                    "unreadCount": unreadCount
                ])
            case .authenticationFailed(let error):
                self.sendEvent("authenticationFailed", [
                    "reason": error.localizedDescription
                ])
            case .connectionStatusChanged(let connectionStatus):
                self.sendEvent("connectionStatusChanged", [
                    "connectionStatus": connectionStatus
                ])
            case .sendMessageFailed(let cause):
                self.sendEvent("sendMessageFailed", [
                    "cause": cause
                ])
            case .conversationAdded(let conversationId):
                self.sendEvent("conversationAdded", [
                    "conversationId": conversationId
                ])
            @unknown default:
                break
            }
        }
    }

  @objc(updatePushNotificationToken:)
    func updatePushNotificationToken( token: Data) -> Void {
      PushNotifications.updatePushNotificationToken(token)
    }

    @objc(showNotification:completionHandler:)
    static func showNotification(
      _ userInfo: [AnyHashable: Any],
      withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) -> Bool {
      var handled = true
      let shouldBeDisplayed = PushNotifications.shouldBeDisplayed(userInfo)

      switch shouldBeDisplayed {
      case .messagingShouldDisplay:
        if #available(iOS 14.0, *) {
          completionHandler([.banner, .sound, .badge])
        } else {
          completionHandler([.alert, .sound, .badge])
        }
      case .messagingShouldNotDisplay:
        completionHandler([])
      case .notFromMessaging:
        fallthrough
      @unknown default:
        handled = false
      }

      return handled
    }

    @objc(handleNotification:completionHandler:)
    static func handleNotification(
      _ userInfo: [AnyHashable: Any],
      withCompletionHandler completionHandler: @escaping () -> Void
    ) -> Bool {
      var handled = true
      let shouldBeDisplayed = PushNotifications.shouldBeDisplayed(userInfo)

      switch shouldBeDisplayed {
      case .messagingShouldDisplay:
        openMessageViewByPushNotification(userInfo) { openBeforeInitialize in
          receivedUserInfo = openBeforeInitialize ? userInfo : nil
        }
        completionHandler()
      case .messagingShouldNotDisplay:
        completionHandler()
      case .notFromMessaging:
        fallthrough
      @unknown default:
        handled = false
      }

      return handled
    }

    static func openMessageViewByPushNotification(
      _ userInfo: [AnyHashable: Any]? = nil,
      completionHandler: ((Bool) -> Void)? = nil
    ) -> Void {
      guard let userInfo = userInfo ?? receivedUserInfo else {
        completionHandler?(false)
        return
      }

      PushNotifications.handleTap(userInfo) { viewController in
        receivedUserInfo = nil
        guard let rootController = RCTPresentedViewController(),
              let viewController = viewController else {
          completionHandler?(viewController == nil)
          return
        }
        rootController.show(viewController, sender: self)
        completionHandler?(false)
      }
    }


}
