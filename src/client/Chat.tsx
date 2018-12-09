import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {IAppState} from '../common/redux/configureStore'
import './Chat.less'

interface IChatMessage {
	author: string
	text: string
}

interface IChatProps {
	messages?: IChatMessage[]
}

export const chatInputId = 'chatInput'

export class Chat extends Component<IChatProps> {
	public static defaultProps = {
		messages: [
			{author: 'tom', text: 'hello world'},
			{author: 'david', text: 'fu'},
			{author: 'tom', text: 'wtf'},
		],
	}

	public render() {
		const {messages} = this.props

		return (
			<div id="chat">
				<ul>
					{messages.map((x, i) => <li key={i}>{x.author}: {x.text}</li>)}
				</ul>
				<input id={chatInputId} type="text" />
			</div>
		)
	}
}

export const ConnectedChat = connect((state: IAppState) => ({
}))(Chat)
