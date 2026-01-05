import * as React from 'react';
import type { IAisPortalProps } from './IAisPortalProps';
import App from './App';

export default class AisPortal extends React.Component<IAisPortalProps> {
  public render(): React.ReactElement<IAisPortalProps> {
    return <App context={this.props.context} />;
  }
}
