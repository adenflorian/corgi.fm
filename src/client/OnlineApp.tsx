import * as React from 'react'
import {ConnectedChat} from './Chat'
import {ConnectedContextMenuContainer} from './ContextMenu/ContextMenuContainer'
import {ConnectedSimpleGraph} from './SimpleGraph/SimpleGraph'
import {ConnectedTopDiv} from './TopDiv'

interface IOnlineAppProps {}

export class OnlineApp extends React.PureComponent<IOnlineAppProps> {
	public render() {
		return (
			<React.Fragment>
				<ConnectedChat />
				<ConnectedTopDiv />
				<ConnectedSimpleGraph />
				<ConnectedContextMenuContainer />
			</React.Fragment>
		)
	}
}
