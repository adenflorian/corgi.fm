import * as React from 'react'
import {ConnectedChat} from './Chat'
import {ConnectedSimpleGraph} from './SimpleGraph/SimpleGraph'
import {ConnectedTopDiv} from './TopDiv'
import {ContextMenuContainer} from './ContextMenu/ContextMenuContainer';

interface IOnlineAppProps {}

export class OnlineApp extends React.PureComponent<IOnlineAppProps> {
	public render() {
		return (
			<React.Fragment>
				<ConnectedChat />
				<ConnectedTopDiv />
				<ConnectedSimpleGraph />
				<ContextMenuContainer />
			</React.Fragment>
		)
	}
}
