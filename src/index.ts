import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to ZendeskMessagingExpo.web.ts
// and on native platforms to ZendeskMessagingExpo.ts
import ZendeskMessagingExpoModule from './ZendeskMessagingExpoModule';
import ZendeskMessagingExpoView from './ZendeskMessagingExpoView';
import { ChangeEventPayload, ZendeskMessagingExpoViewProps } from './ZendeskMessagingExpo.types';

// Get the native constant value.
export const PI = ZendeskMessagingExpoModule.PI;

export function hello(): string {
  return ZendeskMessagingExpoModule.hello();
}

export async function setValueAsync(value: string) {
  return await ZendeskMessagingExpoModule.setValueAsync(value);
}

const emitter = new EventEmitter(ZendeskMessagingExpoModule ?? NativeModulesProxy.ZendeskMessagingExpo);

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { ZendeskMessagingExpoView, ZendeskMessagingExpoViewProps, ChangeEventPayload };
