import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {chatSubmit, IChatMessage, selectAllMessages} from '../common/redux/chat-redux'
import {selectLocalClient} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import './Chat.less'

interface IChatComponentState {
	chatMessage: string
	isChatFocused: boolean
}

interface IChatProps {
	author?: string
	authorColor?: string
	dispatch?: Dispatch
	messages?: IChatMessage[]
}

export const chatInputId = 'chatInput'

export class Chat extends Component<IChatProps, IChatComponentState> {
	public static defaultProps = {
		messages: [],
	}

	public state: IChatComponentState = {
		chatMessage: '',
		isChatFocused: false,
	}

	public render() {
		const {messages} = this.props

		return (
			<div
				id="chat"
				style={{
					zIndex: this.state.isChatFocused ? 1 : 0,
					userSelect: this.state.isChatFocused ? 'text' : 'none',
				}}
				onFocus={() => this.setState({isChatFocused: true})}
				onBlur={() => this.setState({isChatFocused: false})}
				tabIndex={-1}
				className={this.state.isChatFocused ? 'focused' : ''}
			>
				<div
					id="chatGradient"
					className={this.state.isChatFocused ? '' : 'chatVerticalGradient'}
				/>
				<div
					id="chatGradient"
					className={this.state.isChatFocused ? '' : 'chatHorizontalGradient'}
				/>
				<ul>
					{messages.map((x, i) =>
						<li key={i}>
							<span style={{color: x.color}}>{x.authorName}:</span> {x.text}
						</li>,
					)}
				</ul>
				<form onSubmit={this._onSubmit} style={{textAlign: 'initial'}}>
					<input
						id={chatInputId}
						type="text"
						onChange={this._onInputChange}
						value={this.state.chatMessage}
						autoComplete="off"
					/>
				</form>
			</div>
		)
	}

	private _onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({chatMessage: e.target.value})

	private _onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		this.props.dispatch(chatSubmit({
			authorName: this.props.author,
			text: this.state.chatMessage,
			color: this.props.authorColor,
		}))
		this.setState({chatMessage: ''})
		e.preventDefault()
	}
}

export const ConnectedChat = connect((state: IAppState) => ({
	author: selectLocalClient(state).name,
	authorColor: selectLocalClient(state).color,
	messages: selectAllMessages(state),
}))(Chat)
