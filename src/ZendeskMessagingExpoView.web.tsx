import * as React from 'react';

import { ZendeskMessagingExpoViewProps } from './ZendeskMessagingExpo.types';

export default function ZendeskMessagingExpoView(props: ZendeskMessagingExpoViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
