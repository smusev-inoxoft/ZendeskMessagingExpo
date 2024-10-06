import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { ZendeskMessagingExpoViewProps } from './ZendeskMessagingExpo.types';

const NativeView: React.ComponentType<ZendeskMessagingExpoViewProps> =
  requireNativeViewManager('ZendeskMessagingExpo');

export default function ZendeskMessagingExpoView(props: ZendeskMessagingExpoViewProps) {
  return <NativeView {...props} />;
}
