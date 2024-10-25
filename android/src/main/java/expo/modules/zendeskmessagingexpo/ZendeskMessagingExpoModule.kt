package expo.modules.zendeskmessagingexpo

import android.content.Context
import android.content.Intent
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import zendesk.android.Zendesk
import zendesk.android.events.ZendeskEvent
import zendesk.messaging.android.DefaultMessagingFactory
import zendesk.messaging.android.push.PushNotifications
import zendesk.messaging.android.push.PushResponsibility

class ZendeskMessagingExpoModule : Module() {

	override fun definition() = ModuleDefinition {
		Name("ZendeskMessagingExpo")

		Events(
			"unreadMessageCountChanged",
			"authenticationFailed",
			"fieldValidationFailed",
			"connectionStatusChanged",
			"sendMessageFailed",
			"conversationAdded",
		)

		AsyncFunction("initialize") { config: Map<String, String>, promise: Promise ->
			val reactContext = appContext.reactContext!!
			val channelKey = config["channelKey"] as String
			Zendesk.initialize(
				reactContext,
				channelKey,
				successCallback = { _ ->
					// If Zendesk initialization is successful, resolve the promise
					setupEventObserver()
					promise.resolve()
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
		}

		AsyncFunction("reset") { promise: Promise ->
			try {
				Zendesk.invalidate()
				promise.resolve()
			} catch (exception: Exception) {
				promise.reject("UnexpectedError", "An unexpected error occurred", exception)
			}
		}

		AsyncFunction("openMessagingView") { promise: Promise ->
			val reactContext = appContext.reactContext ?: return@AsyncFunction promise.reject(
				CodedException("React context is not available")
			)
			Zendesk.instance.messaging.showMessaging(
				reactContext, Intent.FLAG_ACTIVITY_NEW_TASK
			)
			promise.resolve()
		}

		AsyncFunction("loginUser") { jwt: String, promise: Promise ->
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
						"Zendesk initialization failed",
						error
					)
				})
		}

		AsyncFunction("logoutUser") { promise: Promise ->
			Zendesk.instance.logoutUser(
				successCallback = {
					promise.resolve(null) // Resolve the promise on success
				},
				failureCallback = { error ->
					promise.reject("LogoutError", "Logout failed", error)
				})
		}

		AsyncFunction("getUnreadMessageCount") { ->
			Zendesk.instance.messaging.getUnreadMessageCount()
		}

		AsyncFunction("handleNotification") { remoteMessage: Map<String, String>, promise: Promise ->
			try {
				val responsibility = handleZendeskNotification(
					context = appContext.reactContext!!,
					messageData = remoteMessage,
				)
				promise.resolve(responsibility)
			} catch (error: Exception) {
				promise.reject("UnexpectedError", "An unexpected error occurred", error)
			}
		}

		AsyncFunction("updatePushNotificationToken") { newToken: String ->
			PushNotifications.updatePushNotificationToken(newToken)
		}
	}

	private fun setupEventObserver() {
		// Add the event listener for Zendesk events
		Zendesk.instance.addEventListener { zendeskEvent ->
			when (zendeskEvent) {
				is ZendeskEvent.UnreadMessageCountChanged -> {
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

	private fun handleZendeskNotification(
		context: Context,
		messageData: Map<String, String>,
	): String {
		return when (PushNotifications.shouldBeDisplayed(messageData)) {
			PushResponsibility.MESSAGING_SHOULD_DISPLAY -> {
				PushNotifications.displayNotification(context, messageData)
				"MESSAGING_SHOULD_DISPLAY"
			}
			PushResponsibility.MESSAGING_SHOULD_NOT_DISPLAY -> "MESSAGING_SHOULD_NOT_DISPLAY"
			PushResponsibility.NOT_FROM_MESSAGING -> "NOT_FROM_MESSAGING"
			else -> "UNKNOWN"
		}
	}
}
