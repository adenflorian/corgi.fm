import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {IChatMessage, selectAllMessages} from '../../common/redux'
import {IClientAppState} from '../../common/redux'

interface IChatMessagesProps {
	messages: IChatMessage[]
}

export class ChatMessages extends Component<IChatMessagesProps> {
	public static defaultProps = {
		messages: [],
	}

	public render() {
		const {messages} = this.props

		return (
			<ul id="chatMessages">
				{messages.map((x, i) =>
					<li key={i}>
						<div className="selectable" tabIndex={-1}>
							<span className="author" style={{color: x.color}}>
								{x.authorName}
							</span>
							<span className="text" >
								{x.text}
							</span>
						</div>
					</li>,
				)}
			</ul>
		)
	}
}

export const ConnectedChatMessages = connect((state: IClientAppState) => ({
	messages: selectAllMessages(state.room),
}))(ChatMessages)
