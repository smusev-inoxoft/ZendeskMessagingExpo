package expo.modules.zendeskmessagingexpo

import android.content.Context
import android.content.Intent
import android.net.http.HttpException
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import zendesk.android.Zendesk
import zendesk.logger.Logger
import zendesk.android.events.ZendeskEventListener
import zendesk.android.events.ZendeskEvent
import zendesk.messaging.android.DefaultMessagingFactory
import zendesk.messaging.android.push.PushNotifications
import zendesk.messaging.android.push.PushResponsibility


class ZendeskMessagingExpoModule : Module() {
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    override fun definition() = ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ZendeskMessagingExpo')` in JavaScript.
        Name("ZendeskMessagingExpo")

        Events(
            "unreadMessageCountChanged",
            "authenticationFailed",
            "fieldValidationFailed",
            "connectionStatusChanged",
            "sendMessageFailed",
            "conversationAdded",
        )

        // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
        Constants(
            "PI" to Math.PI
        )


        // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
        Function("hello") {


            "Hello from zendesk android module! 👋"
        }

        // Defines a JavaScript function that always returns a Promise and whose native code
        // is by default dispatched on the different thread than the JavaScript runtime runs on.
        AsyncFunction("initialize") { channelKey: String, promise: Promise ->
            val reactContext = appContext.reactContext!!
            try {
                Zendesk.initialize(
                    reactContext,
                    channelKey,
                    successCallback = { zendesk ->
                        // If Zendesk initialization is successful, resolve the promise
                        setupEventObserver()
                        promise.resolve("Zendesk initialized successfully")
                    },
                    failureCallback = { error ->
                        // If there is an error during initialization, reject the promise
                        promise.reject(
                            "ZendeskInitError",
                            "Zendesk initialization failed: " + error.message,
                            error
                        )
                    },
                    messagingFactory = DefaultMessagingFactory()
                )
            } catch (e: Exception) {
                // Catch any other unexpected exceptions and reject the promise
                promise.reject("UnexpectedError", "An unexpected error occurred", e)
            }
        }

        AsyncFunction("reset") { promise: Promise ->
            try {
                Zendesk.invalidate()
                promise.resolve("Messaging view opened successfully")
            } catch (e: Exception) {
                promise.reject("UnexpectedError", "An unexpected error occurred", e)
            }
        }

        AsyncFunction("openMessagingView") { promise: Promise ->
            val reactContext = appContext.reactContext!!

            try {
                Zendesk.instance.messaging.showMessaging(
                    reactContext,
                    Intent.FLAG_ACTIVITY_NEW_TASK
                )
                // Resolve the promise once the messaging view is shown successfully
                promise.resolve("Messaging view opened successfully")
            } catch (e: Exception) {
                // Reject the promise if an error occurs
                promise.reject(
                    "OpenMessagingViewError",
                    "Failed to open messaging view: " + e.message,
                    e
                )
            }
        }

        AsyncFunction("loginUser") { jwt: String, promise: Promise ->

            try {
                Zendesk.instance.loginUser(
                    jwt,
                    successCallback = { zendeskUser ->

                        val userMap = mapOf(
                            "id" to zendeskUser.id,
                            "externalId" to zendeskUser.externalId
                        )
                        promise.resolve(userMap)
                    },
                    failureCallback = { error ->
                        promise.reject(
                            "ZendeskInitError",
                            "Zendesk initialization failed: " + error.message,
                            error
                        )
                    }
                )
            } catch (e: Exception) {
                promise.reject("UnexpectedError", "An unexpected error occurred", e)
            }
        }

        AsyncFunction("logoutUser") { promise: Promise ->
            try {
                // Call the logoutUser function from the Zendesk instance
                Zendesk.instance?.logoutUser(
                    successCallback = {
                        promise.resolve(null) // Resolve the promise on success
                    },
                    failureCallback = { error ->
                        promise.reject("LogoutError", "Logout failed: ${error.message}", error)
                    }
                )
            } catch (e: Exception) {
                promise.reject("UnexpectedError", "An unexpected error occurred", e)
            }
        }

        AsyncFunction("getUnreadMessageCount") { ->
            Zendesk.instance?.messaging?.getUnreadMessageCount() ?: 0
        }

        AsyncFunction("handleNotification") { remoteMessage: Map<String, String>, promise: Promise ->
            try {
                handleZendeskNotification(
                    context = appContext.reactContext!!,
                    messageData = remoteMessage,
                ) { responsibility -> promise.resolve(responsibility) }
            } catch (error: Exception) {
                promise.reject("UnexpectedError", "An unexpected error occurred", error)
            }
        }

        AsyncFunction("updatePushNotificationToken") { newToken: String ->
            try {
                // Update the push notification token
                PushNotifications.updatePushNotificationToken(newToken)
                // Return success response
                "Push notification token updated successfully"
            } catch (error: Exception) {
                // Handle any exceptions that occur
                throw error
            }
        }
    }

    private fun setupEventObserver() {
        // Add the event listener for Zendesk events
        Zendesk.instance.addEventListener { zendeskEvent ->
            when (zendeskEvent) {
                is ZendeskEvent.UnreadMessageCountChanged -> {
                    Log.d("Zendesk", "Event received")

                    val eventData = mapOf(
                        "unreadCount" to zendeskEvent.currentUnreadCount
                    )
                    sendEvent("unreadMessageCountChanged", eventData)
                }

                is ZendeskEvent.AuthenticationFailed -> {
                    val eventData = mapOf(
                        "reason" to zendeskEvent.error.message
                    )
                    sendEvent("authenticationFailed", eventData)
                }

                is ZendeskEvent.FieldValidationFailed -> {
                    val eventData = mapOf(
                        "errors" to zendeskEvent.errors
                    )
                    sendEvent("fieldValidationFailed", eventData)
                }

                is ZendeskEvent.ConnectionStatusChanged -> {
                    val eventData = mapOf(
                        "connectionStatus" to zendeskEvent.connectionStatus
                    )
                    sendEvent("connectionStatusChanged", eventData)
                }

                is ZendeskEvent.SendMessageFailed -> {
                    val eventData = mapOf(
                        "cause" to zendeskEvent.cause
                    )
                    sendEvent("sendMessageFailed", eventData)
                }

                is ZendeskEvent.ConversationAdded -> {
                    val eventData = mapOf(
                        "conversationId" to zendeskEvent.conversationId
                    )
                    sendEvent("conversationAdded", eventData)
                }

                else -> {
                    // Handle other events if necessary
                }
            }
        }
    }

    fun handleZendeskNotification(
        context: Context,
        messageData: Map<String, String>,
        callback: ((String) -> Unit)?,
    ): Boolean {
        var handled = true
        when (PushNotifications.shouldBeDisplayed(messageData)) {
            PushResponsibility.MESSAGING_SHOULD_DISPLAY -> {
                PushNotifications.displayNotification(context, messageData)
                callback?.invoke("MESSAGING_SHOULD_DISPLAY")
            }

            PushResponsibility.MESSAGING_SHOULD_NOT_DISPLAY -> {
                callback?.invoke("MESSAGING_SHOULD_NOT_DISPLAY")
            }

            PushResponsibility.NOT_FROM_MESSAGING -> {
                callback?.invoke("NOT_FROM_MESSAGING")
                handled = false
            }

            else -> {
                callback?.invoke("UNKNOWN")
                handled = false
            }
        }

        return handled
    }


}
