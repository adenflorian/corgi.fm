import React from 'react'
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
			<React.Fragment>
				<ul id="chatMessagesBack" className="chatMessages">
					{messages.map((x, i) => {
						const opacity = determineOpacity(i, messages.length)
						if (opacity <= 0) return null
						return (
							// TODO Bad key
							<li key={i} style={{opacity: determineOpacity(i, messages.length)}}>
								<div className="selectable" tabIndex={-1}>
									<span className="author" style={{color: x.color}}>
										{x.authorName}
									</span>
									<span className="text" >
										{x.text}
									</span>
								</div>
							</li>
						)
					})}
				</ul>
				<ul id="chatMessagesFront" className="chatMessages">
					{messages.filter(x => !x.isOldMessage).map((x, i) =>
						// TODO Bad key
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
			</React.Fragment>
		)
	}
}

function determineOpacity(index: number, max: number) {
	const x = max - index - 1
	const a = -0.001
	return Math.max(0, (a * Math.pow(x, 2)) + 1)
}

export const ConnectedChatMessages = connect((state: IClientAppState) => ({
	messages: selectAllMessages(state.room),
}))(ChatMessages)
