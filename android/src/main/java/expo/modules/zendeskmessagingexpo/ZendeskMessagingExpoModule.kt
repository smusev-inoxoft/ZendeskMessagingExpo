package expo.modules.zendeskmessagingexpo

import android.content.Intent
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import zendesk.android.Zendesk
import zendesk.logger.Logger
import zendesk.messaging.android.DefaultMessagingFactory

class ZendeskMessagingExpoModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ZendeskMessagingExpo')` in JavaScript.
    Name("ZendeskMessagingExpo")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants(
      "PI" to Math.PI
    )

 
    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {


      "Hello world! 👋"
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
            promise.resolve("Zendesk initialized successfully")
          },
          failureCallback = { error ->
            // If there is an error during initialization, reject the promise
            promise.reject("ZendeskInitError", "Zendesk initialization failed: "+error.message, error)
          },
          messagingFactory = DefaultMessagingFactory()
        )
      } catch (e: Exception) {
        // Catch any other unexpected exceptions and reject the promise
        promise.reject("UnexpectedError", "An unexpected error occurred", e)
      }
    }

    AsyncFunction("openMessagingView") { promise: Promise ->
      val reactContext = appContext.reactContext!!

      try {
        Zendesk.instance.messaging.showMessaging(reactContext, Intent.FLAG_ACTIVITY_NEW_TASK)
        // Resolve the promise once the messaging view is shown successfully
        promise.resolve("Messaging view opened successfully")
      } catch (e: Exception) {
        // Reject the promise if an error occurs
        promise.reject("OpenMessagingViewError", "Failed to open messaging view: "+e.message, e)
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
            promise.reject("ZendeskInitError", "Zendesk initialization failed: "+error.message, error)
          }
        )
      } catch (e: Exception) {
        promise.reject("UnexpectedError", "An unexpected error occurred", e)
      }
    }


  }
}
